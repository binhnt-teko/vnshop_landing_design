import React from 'react';
import ReactDOM from 'react-dom';
import { polyfill } from 'react-lifecycles-compat';
import { Button } from 'antd';
import { BarsOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { FormattedMessage } from 'react-intl';
import dragula from 'dragula';

import { getCurrentDom } from '../utils/utils';
import { isImg, mergeEditDataToDefault, deepCopy, getDataSourceValue, mdId, objectEqual, getChildRect } from '../share/utils';
import * as utils from '../share/theme.template.utils';
import webData from '../config/template.config';
import tempData from '../config/template.list';
import * as actions from '../shared/redux/actions';

import EditButton from './StateComponents/EditButtonView';
import SwitchSlideView from './StateComponents/SwitchSlideView';
import Editor from './MediumEditor';

class EditStateController extends React.Component {
  static defaultProps = {
    className: 'edit-stage',
  };

  static getDerivedStateFromProps(props, { prevProps, $self }) {
    let nextState = {
      prevProps: props,
    };
    if (prevProps && props !== prevProps
      && props.mediaStateSelect !== prevProps.mediaStateSelect) {
      const newState = $self.getResetRectState();
      nextState = {
        ...nextState,
        ...newState,
      };
    }
    return nextState;
  }

  scrollTop = 0;

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      iframe: null,
      currentHoverRect: {},
      currentSelectRect: {},
      $self: this,
    };
  }

  componentDidMount() {
    // Receive the dom data from the child;
    // window.addEventListener('message', this.receiveDomData);
    //binhnt: Set function to get list of editable components from template
    window.receiveDomData = this.receiveDomData;

    // Listen event resize 
    window.addEventListener('resize', () => {
      this.reRect();
    });
    // Drag
    let newId;
    this.side = document.querySelector('.edit-side-drawer .drawer-content .img-content-wrapper');
    this.stage = document.querySelector('.edit-stage .overlay');

    let stateChild;

    //binhnt
    const t = dragula([this.side, this.stage], {
      copy: (el, source) => source === this.side,
      moves: (el, container, handle) => (
        handle.classList.contains('drag-hints') || handle.classList.contains('img')
        || handle.tagName.toLocaleLowerCase() === 'img'
      ),
      accepts: (el, source) => {
        if (source === this.stage) {
          const elKey = el.getAttribute('data-key');
          const data = this.state.data;
          const dArr = Object.keys(data).filter((key) => key.split('_')[0] === elKey)
            .map((key) => parseFloat(key.split('_')[1])).sort((a, b) => a - b);
          newId = `${elKey}_${(dArr[dArr.length - 1] + 1) || 0}`;
          const sourceArray = Array.prototype.slice.call(source.children);
          stateChild = stateChild || sourceArray;
          const placeholder = source.querySelectorAll('.placeholder')[0];
          const ci = sourceArray.indexOf(placeholder);
          if (ci >= 0) {
            const dom = sourceArray[(ci - 1 >= 0) ? ci - 1 : 0];
            if (dom) {
              placeholder.style.top = ci ? `${dom.offsetTop + dom.offsetHeight}px` : 0;
              placeholder.style.zIndex = dom.style.zIndex;
            }
          }
          const ii = sourceArray.indexOf(el);
          if (ii >= 0
            && sourceArray.map((item) => item.getAttribute('id')).join()
            !== stateChild.map((item) => item.getAttribute('id')).join()) {
            this.setPropsData(el, sourceArray);
            stateChild = sourceArray;
          }
        }
        return source === this.stage;
      },
    });

    t.on('drag', () => {
      newId = '';
      stateChild = null;
      this.isDrag = true;
      this.reRect();
      this.state.className = `${this.state.className} drag`;
    })
      .on('dragend', () => {
        this.state.className = this.stage.className.replace('drag', '').trim();
        this.isDrag = false;
      })
      .on('drop', (el) => {
        if (el.className === 'placeholder') {
          el.innerHTML = '';
          el.setAttribute('id', newId);
        }
      })
      .on('shadow', (e) => {
        // 挡掉上下拖动滚动跳动；
        this.dom.scrollTop = this.scrollTop;
        // 占位符
        if (e.className.indexOf('img-wrapper') >= 0) {
          e.className = 'placeholder';
          //binhnt
          // const isZhCN = utils.isZhCN(this.props.location.pathname);
          const isZhCN = false;
          e.innerHTML = isZhCN ? '放在此处' : 'Placed here';
        }
      })
      .on('out', (el, source) => {
        if (source === this.stage) {
          if (el.className === 'placeholder') { // || el.className === 'overlay-elem'
            this.setPropsData(el, Array.prototype.slice.call(source.children));
          }
        }
      })
      .on('cloned', (clone, original, type) => {
        if (type === 'mirror' && clone.className.indexOf('img-wrapper') === -1) {
          const key = clone.getAttribute('data-key');
          const keyName = key.replace(/[^a-z]/ig, '');
          const keyId = parseFloat(key.replace(/[a-z]/ig, ''));
          const item = webData[keyName].data
            .filter((c, i) => (c.uid === keyId || i === keyId))[0];
          clone.style.backgroundImage = `url(${item && item.src})`;
          clone.style.backgroundSize = 'cover';
          clone.style.backgroundPosition = 'center top';
        }
      });
  }

  getResetRectState = () => {
    this.reEditItemVisibility();
    this.currentData = null;
    this.mouseCurrentData = null;
    this.isInput = false;
    return {
      currentHoverRect: {},
      currentSelectRect: {},
      openEditText: false,
    };
  }

  reRect = (noDispatch) => {
    const newState = this.getResetRectState();
    this.setState(newState, () => {
      if (!noDispatch) {
        this.props.dispatch(actions.setCurrentData());
      }
    });
  }

  reEditItemVisibility = () => {
    if (this.currentData) {
      this.currentData.item.style.visibility = '';
    }
  }

  onOverlayScroll = (e) => {
    if (e.target === this.dom) {
      const iframeWindow = this.state.iframe;
      iframeWindow.scrollTo(0, e.target.scrollTop);
      this.scrollTop = e.target.scrollTop;
    }
    // this.reRect();
  }

  refreshCurrentData = (rectArray) => rectArray.filter((item) => (
    item.dataId === this.currentData.dataId
  ))[0];

  //Binhnt:  Process when mouse move 
  wrapperMove = (e) => {
    if (this.state.openEditText) {
      return;
    }
    const dom = e.target;
    // console.log("binhnt.EditStageController: wrapperMove current dom:  ", dom);

    const { data, currentHoverRect } = this.state;

    //binhnt: Set current Rectangle
    let currentSelectRect = this.state.currentSelectRect;

    //binhnt: Only get dom with attribute: data-key 
    if (!this.isDrag && dom.getAttribute('data-key')) {
      const id = dom.getAttribute('id');
      // console.log("binhnt.EditStageController: wrapperMove current dom id:  ", id);

      const currentElemData = data[id];
      if (id) {
        // Reset the rect in the data, and the scroll bar will change accordingly.
        //binhnt: Set currentElementData rect according to data from child iframe 

        // console.log("binhnt.EditStageController: wrapperMove change currentElemData.rect   to currentElemData.item.getBoundingClientRect ");
        currentElemData.rect = currentElemData.item.getBoundingClientRect();
        // Get the child rect with data-id; Because there is an animation component, get it from time to time
      }
      //binhnt: Get array of rectangles 
      const rectArray = currentElemData
        ? getChildRect(currentElemData).concat(data.currentPopover)
        : data.currentPopover;

      // console.log("binhnt.EditStageController: wrapperMove rectArray: ", rectArray)
      if (this.currentData) {
        // console.log("binhnt.EditStageController: wrapperMove change this.currentData by  currentElemData")
        // dom will no longer be the current dom after the queueAnim is deleted; it is currently re-acquired;
        this.currentData = this.refreshCurrentData(rectArray) || this.currentData;

        //binhnt: Set current rectangle base on current Data 
        currentSelectRect = this.currentData.item.getBoundingClientRect();

        // console.log("binhnt.EditStageController: wrapperMove change this.currentData.rect by  currentSelectRect", this.currentData.item)
        this.currentData.rect = currentSelectRect;
      }

      //binhnt: Get domRect => Get position 
      const domRect = this.dom.getBoundingClientRect();


      const pos = {
        x: e.pageX - domRect.x,  //binhnt: Current of mouse - wrapper dom location => get current mouse position in parent dom. 
        y: e.pageY - domRect.y,
      };


      //binhnt: Get currentDom in child with current position 
      let newData = getCurrentDom(pos, rectArray);

      // console.log("binhnt.EditStageController: wrapperMove set newData with getCurrentDom at pos = ", pos)

      // console.log("binhnt.EditStageController: wrapperMove newData: ", newData)

      // console.log("binhnt.EditStageController: wrapperMove update mouseCurrentData with newData:  ", newData);
      this.mouseCurrentData = newData || currentElemData;

      //binhnt: Update change 
      if (this.mouseCurrentData && !objectEqual(this.mouseCurrentData.rect, currentHoverRect)) {
        this.setState({
          currentHoverRect: this.mouseCurrentData.rect,
          currentSelectRect,
        });
      }
    }
  }

  //binhnt: Process data from child (ifrane)
  receiveDomData = (data, iframe, id) => {
    //binhnt: Add to global mdId   each element id
    Object.keys(id).forEach((key) => {
      mdId[key] = id[key];
    });

    const state = {
      data,
      iframe,
    };

    const { parentData } = this.currentData || {};
    if (parentData) {
      const rectArray = getChildRect(parentData);
      const isParentNode = this.currentData.dataId === parentData.dataId;
      this.currentData = isParentNode ? this.currentData : this.refreshCurrentData(rectArray);
      if (this.currentData) {
        const currentSelectRect = this.currentData.item.getBoundingClientRect();
        this.currentData.rect = currentSelectRect;
        state.currentSelectRect = currentSelectRect;
        state.currentHoverRect = currentSelectRect;

        //binhnt: Update state 
        this.setState(state);
      } else {
        this.reRect();
      }
    } else {
      this.setState(state);
    }
  }

  wrapperLeave = () => {
    if (this.state.openEditText) {
      return;
    }
    this.setState({
      currentHoverRect: {},
    });
  }

  closeEditText = () => {
    this.setState({
      openEditText: false,
    });
  }

  setTemplateConfigData = (text) => {
    const data = deepCopy(this.props.templateData);
    // data.noHistory = noHistory;
    const ids = this.currentData.dataId.split('-');
    const t = getDataSourceValue(ids[1], data.data.config, [ids[0], 'dataSource']);
    t.children = text;
    this.props.dispatch(actions.setTemplateData(data));
  }

  setTemplateConfigObject = (obj) => {
    const data = this.props.templateData;
    const ids = this.currentData.dataId.split('-');
    const newIds = ids[1].split('&').filter((c) => c);
    const endKey = newIds.pop();
    const endKeyArray = endKey.split('=');

    const t = getDataSourceValue(newIds.join('&'), data.data.config, [ids[0], 'dataSource']);
    if (endKeyArray.length && endKeyArray[0] === 'array_name') {
      const i = t.findIndex((item) => item.name === endKeyArray[1]);
      t[i] = obj;
    } else {
      t[endKey] = obj;
    }
    this.props.dispatch(actions.setTemplateData(data));
  }

  editTextHandleBlur = (text) => {
    // 修改 props 里的 dataSource 数据
    this.setTemplateConfigData(text);
    setTimeout(() => {
      this.isInput = false;
      this.closeEditText();
      this.reEditItemVisibility();
    });
  }

  editTextHandleChange = (b) => {
    this.isInput = true;
    b.style.height = 'auto';
    const height = b.scrollHeight;
    b.parentNode.parentNode.style.height = `${height}px`;
    b.style.height = '';
  }

  getDataSourceChildren = (_t, id) => {
    // console.log("binhnt.EditStageController: getDataSourceChildren _t= ", _t, id);
    const ids = id.split('&');
    let t = _t;
    ids.forEach((key) => {
      const nameKey = key.split('=');
      if (nameKey.length > 1 && nameKey[0] === 'array_name') {
        // console.log("binhnt.EditStageController: getDataSourceChildren nameKey[1] = ", nameKey[1]);
        t.forEach((item) => {
          if (item.name === nameKey[1]) {
            t = item;
            // console.log("binhnt.EditStageController: getDataSourceChildren item = ", item);
          }
        });
      } else {
        t = t[key];
      }
    });
    return t;
  }

  //binhnt: display when mouse click or move
  getCatcherDom = (rect, css) => {
    //binhnt
    if (rect.width || rect.width === 0) {
      let editText;
      let editData;
      if (css === 'select') {
        // console.log("Binhnt.EditStageController: getCatcherDom  currentIdArray = ",this.currentIdArray[0]);
        // console.log("Binhnt.EditStageController: getCatcherDom  editId = ", this.editId);
        // console.log("Binhnt.EditStageController: getCatcherDom  tempData = ", JSON.stringify(tempData));
        // console.log("Binhnt.EditStageController: getCatcherDom  editChildId = ", this.editChildId);
        const currentConfigDataSource = mergeEditDataToDefault(
          this.props.templateData.data.config[this.currentIdArray[0]], tempData[this.editId]);

        // console.log("Binhnt.EditStageController: getCatcherDom  currentConfigDataSource = ", JSON.stringify(currentConfigDataSource));

        editData = this.getDataSourceChildren(currentConfigDataSource,
          this.editChildId);
        // console.log("Binhnt.EditStageController: getCatcherDom  editData = ",editData);
        editText = editData.children;
        editText = typeof editText === 'string' && editText.match(isImg) ? 'Please enter...' : editText;
      }
      // console.log("Binhnt.EditStageController: getCatcherDom  editText = ",editText);
      return (
        <div className={css}
          style={{
            width: rect.width,
            height: rect.height,
            left: rect.x,
            top: rect.y + this.scrollTop,
          }}
        >
          {css === 'select' && (
            <EditButton
              setTemplateConfigData={this.setTemplateConfigData}
              setTemplateConfigObject={this.setTemplateConfigObject}
              closeEditText={this.closeEditText}
              openEditTextFunc={this.editTextFunc}
              editButtonArray={this.state.editButton}
              currentData={this.currentData}
              scrollTop={this.scrollTop}
              onParentChange={this.onEditSelectChange}
              editText={editData.children}
              editData={editData}
            />
          )}

          {css === 'select' && this.state.openEditText ? (
            <div className="edit-text-wrapper">
              <Editor
                onChange={this.editTextHandleChange}
                onBlur={this.editTextHandleBlur}// 记录编辑 history
                text={editText}
                textToString={editData.toText}// 有 toText 用 innerText
                ref={(c) => {
                  const d = ReactDOM.findDOMNode(c);
                  if (!d) {
                    return;
                  }
                  if (!this.isInput) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(d);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }}
              />
              <style
                dangerouslySetInnerHTML={{
                  __html: `.edit-text-wrapper{${document.defaultView.getComputedStyle(this.currentData.item).cssText}
                    visibility: inherit;
                  }`,
                }}
              />
            </div>
          ) : null}
        </div>
      );
    }
  }

  //binhnt: Called when user click 
  selectSteState = (currentSelectRect, editData, dom, id) => {
    console.log("binhnt.EditStageController: selectSteState => Change sate ")
    //binhnt: Update state
    this.setState({
      currentHoverRect: currentSelectRect,
      currentSelectRect,
      editButton: editData && editData.split(','), // Text and picture button configuration
      openEditText: false,
    }, () => {
      const { data } = this.state;
      console.log("binhnt.EditStageController: selectSteState => Change sate => call setCurrentData ", dom)
      this.props.dispatch(actions.setCurrentData(
        {
          dom,
          parentDom: dom.parentNode,
          id,
          reRect: this.reRect,
          iframe: this.state.iframe,
          currentPopover: data && data.currentPopover,
        }
      ));
    });

    this.reEditItemVisibility();
  }

  setPropsData = (el, children) => {
    const template = children.map((item) => item.getAttribute('id')).filter((id) => id);
    const { templateData } = this.props;
    if (el.className === 'placeholder') {
      el.remove();
    }
    templateData.data = {
      ...templateData.data,
      template,
    };
    const { dispatch } = this.props;
    dispatch(actions.setTemplateData(templateData));
  };

  //binhnt: handle click event when user click to element 
  onClick = (e) => {

    const dom = e.target;
    // console.log("binhnt.onClick: Dom clicked:", e.target);
    //binhnt: Only focus on dom which have data-key attribute 
    if (!this.isDrag && dom.getAttribute('data-key') && this.mouseCurrentData) {
      console.log("binhnt.EditStageController: onClick: set selectParentDom = current dom");
      this.selectParentDom = dom;

      // console.log("binhnt.EditStageController: onClick mouseCurrentData = ",  this.mouseCurrentData);
      this.currentIdArray = this.mouseCurrentData.dataId.split('-');
      this.editId = this.currentIdArray[0].split('_')[0];
      console.log("binhnt.EditStageController: onClick editId = ", this.editId);

      this.editChildId = this.currentIdArray[1];
      this.currentData = this.mouseCurrentData;

      console.log("binhnt.EditStageController: currentData.item  = ", this.currentData.item);

      const currentDom = this.currentData.item;
      const editData = currentDom.getAttribute('data-edit');
      console.log("Binhnt.EditStageController: onClick => Click call  selectSteState with editData: ", editData);

      this.selectSteState(
        this.state.currentHoverRect,
        editData,
        currentDom,
        this.mouseCurrentData.dataId
      );
    }
    this.isDrag = false;
  }

  onEditSelectChange = (v) => {
    if (!v) {
      return;
    }
    this.currentIdArray = v.dataId.split('-');
    this.editId = this.currentIdArray[0].split('_')[0];
    this.editChildId = this.currentIdArray[1];
    this.currentData = v;
    const currentDom = v.item;
    const currentDomRect = currentDom.getBoundingClientRect();
    this.currentData.rect.y = currentDomRect.y;
    const editData = currentDom.getAttribute('data-edit');
    this.selectSteState(this.currentData.rect, editData, currentDom, v.dataId);
  }

  //binhnt: Called when user need edit Text => set openEditText 
  editTextFunc = () => {
    this.currentData.item.style.visibility = 'hidden';
    this.isInput = false;
    this.setState({
      openEditText: true,
    });
  }

  //binhnt: Called when user double click to element 
  onDoubleClick = (e) => {
    const dom = e.target;
    if (dom.getAttribute('data-key') && this.mouseCurrentData) {
      this.currentData = this.mouseCurrentData;
      const editData = this.currentData.item.getAttribute('data-edit');
      if (editData && editData.indexOf('text') >= 0
        && editData !== 'texty' && editData.indexOf('textAndImage') === -1) {
        //binhnt: Call edit text funciton 
        this.editTextFunc();
      }
    }
  }

  //binhnt: Process when click up/down...
  onFuncClick = (type, key) => {
    this.reRect();
    const { templateData } = this.props;
    const { template, style } = templateData.data;
    const { iframe } = this.state;
    const config = templateData.data.config;
    const current = template.indexOf(key);
    switch (type) {
      case 'up':
        template[current] = template.splice(current - 1, 1, template[current])[0];
        break;
      case 'down':
        template[current] = template.splice(current + 1, 1, template[current])[0];
        break;
      default:
        template.splice(current, 1);
        templateData.data.style = style.filter((item) => {
          if (item.cid === key) {
            const styleNode = iframe.document.getElementById(item.id);
            if (styleNode) {
              styleNode.parentNode.removeChild(styleNode);
            }
          }
          return item.cid !== key;
        });
        delete config[key];
        break;
    }
    if (this.state.openEditText) {
      this.setState({
        openEditText: false,
      }, () => {
        this.props.dispatch(actions.setTemplateData(templateData));
      });
    } else {
      this.props.dispatch(actions.setTemplateData(templateData));
    }
  }

  //binhnt: Process with icon 
  getFuncIconChild = (i, dataArray, key) => {
    // console.log("binhnt.EditStageController: getFuncIconChild: start ")
    return ['up', 'down', 'delete'].map((type) => {
      let disabled = false;
      let child = <DeleteOutlined />;
      switch (type) {
        case 'up':
          disabled = !i;
          child = <UpOutlined />;
          break;
        case 'down':
          disabled = i === dataArray.length - 1;
          child = <DownOutlined />;
          break;
        default:
          disabled = dataArray.length === 1;
          break;
      }
      return (
        <Button
          type="primary"
          disabled={disabled}
          key={type}
          onClick={(e) => { this.onFuncClick(type, key, e); }}
        >
          {child}
        </Button>
      );
    });
  }

  //binhnt: process with slide view 
  getFuncCompChild = (comp, dataId) => {
    // console.log("Binhnt.EditStateController: getFuncCompChild: test comp: ", comp, dataId);
    const compArray = comp.split('=');
    const name = compArray[0];
    const data = JSON.parse(compArray[1] || '{}');
    switch (name) {
      case 'banner-switch':
      case 'tabs-switch':
      case 'carousel-switch':
        return (
          <SwitchSlideView
            {...this.props}
            data={data}
            name={name.split('-')[0]}
            dataId={dataId}
            iframe={this.state.iframe}
            reRect={this.reRect}
          />
        );
      default:
        return null;
    }
  }

  //binhnt: main component render 
  render() {
    const { className, mediaStateSelect } = this.props;
    const { data, currentHoverRect, currentSelectRect, iframe, openEditText } = this.state;

    // Remove the data of the bullet frame
    const dataArray = data ? Object.keys(data).filter((key) => key !== 'currentPopover') : [];

    //binhnt: Create overlay child
    const overlayChild = dataArray.map((key, i) => {
      // console.log('binhnt.EditStageController: render: start overlayChild: ' + key );
      const item = data[key];
      const itemStyle = window.getComputedStyle(item.item);
      //binhnt: Process for each components 
      return (
        <div
          key={key}
          id={key}
          data-key={key.split('_')[0]}
          style={{
            width: '100%',
            height: itemStyle.height,
            position: 'absolute', // Positioning becomes invalid after setting margin, use absolute
            top: item.item.offsetTop,
            zIndex: itemStyle.zIndex,
          }}
          className="overlay-elem"
        >
          <div className="drag-hints">
            <BarsOutlined />
            {' '}
            <FormattedMessage id="app.state.drag" />
          </div>
          <div className="func-wrapper">
            {
              this.getFuncIconChild(i, dataArray, key)
            }
          </div>
          {
            item.comp && this.getFuncCompChild(item.comp, key)
          }
        </div>
      );
    });

    //
    const overlayHeight = iframe && iframe.document.getElementById('react-content').offsetHeight;

    //binhnt: main component render 
    return (
      <div
        className={`${className}${mediaStateSelect === 'Mobile' ? ' mobile' : ''}`}
        onScroll={this.onOverlayScroll}
        onMouseLeave={this.wrapperLeave}
        ref={(c) => { this.dom = c; }}
      >
        <div
          data-key="wrapper"
          onMouseMove={this.wrapperMove}
          onMouseEnter={this.wrapperMove}
          onClick={this.onClick}
          onDoubleClick={this.onDoubleClick}
          className="overlay"
          style={{ height: overlayHeight }}
        >
          {overlayChild}
        </div>
        <div className="mouse-catcher" style={{ height: overlayHeight }}>
          {
            !objectEqual(currentHoverRect, currentSelectRect) && !openEditText
            && this.getCatcherDom(currentHoverRect, 'hover')
          }
          {
            this.currentData && this.getCatcherDom(currentSelectRect, 'select')
          }
        </div>
      </div>
    );
  }
}
export default polyfill(EditStateController);
