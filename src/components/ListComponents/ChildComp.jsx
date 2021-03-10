import React from 'react';
import { Collapse, Button, Row, Col, Select } from 'antd';
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  BarsOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { getRandomKey } from 'rc-editor-list/lib/utils';
import { FormattedMessage } from 'react-intl';
import ListSort from '../StateComponents/ListSort';
import tempData from '../../config/template.list';
import { mergeEditDataToDefault, getDataSourceValue, deepCopy } from '../../share/utils';

const Panel = Collapse.Panel;
const Option = Select.Option;
const addDefault = {
  titleWrapper: ['title', 'content', 'image'],
  textAndImage: ['content', 'image'],
  childWrapper: ['title', 'content', 'image', 'button'], // 增加个 texty
};

const noChildProps = ['BannerAnim', 'Content'];

export default class ChildComp extends React.Component {
  editAddDefault = null;

  editType = null;

  getCurrentDataSource = (props) => {
    const { templateData, dataId } = props;
    const id = dataId.split('_')[0];
    return mergeEditDataToDefault(templateData.data.config[dataId], tempData[id]);
  }

  onListChange = (e, ids, currentData, childKey) => {
    currentData[childKey] = e.map((item) => {
      return currentData[childKey].filter((node) => {
        return node.name === item.key;
      })[0];
    });
    this.props.onChange(ids, currentData);
  }

  onSlideDelete = (e, ids, currentData, childKey) => {
    const children = currentData[childKey];
    const i = children.indexOf(e);
    children.splice(i, 1);
    currentData[childKey] = children;
    /* currentData.children
      .map(node => (node === e ? { ...node, delete: true } : node)); */
    this.props.onChange(ids, currentData);
  }

  onAddSelect = (value) => {
    this.editType = value;
  }

  onAdd = (ids, currentData, childKey) => {
    let newData;
    if (this.editAddDefault) {
      console.log("binhnt.ChildComp: onAdd  editAddDefault = true");
      const name = this.editType || this.editAddDefault[0];
      console.log("binhnt.ChildComp: onAdd  name = ", name);

      newData = {
        name: `${name}~${getRandomKey()}`,
        className: '',
        children: name === 'image' ? 'https://zos.alipayobjects.com/rmsportal/HzvPfCGNCtvGrdk.png' : 'Add text',
      };
      if (name === 'button') {
        newData.children = {
          children: newData.children,
          href: '#',
          type: 'default',
        };
      }
    } else {
      newData = deepCopy(currentData[childKey][currentData[childKey].length - 1]);
      delete newData.delete;
      newData.name = `${newData.name.split('~')[0].replace(/[0-9]/ig, '')}~${getRandomKey()}`;
    }
    currentData[childKey].push(newData);
    this.props.onChange(ids, currentData);
  }

  render() {
    const { edit, currentEditData, templateData } = this.props;
    // console.log("Binhnt.ChildComp: edit = ", edit);
    console.log("Binhnt.ChildComp: currentEditData = ", currentEditData);

    const currentEditArray = edit ? edit.split(',') : [];
    const isNoShow = currentEditArray.some((c) => noChildProps.indexOf(c) >= 0);
    const { id, parentDom } = currentEditData;
    const ids = id.split('-');
    const cid = ids[0].split('_')[0];

    // console.log("Binhnt.ChildComp: ids = ", ids);
    const tempDataSource = tempData[cid];
    const newTempDataSource = mergeEditDataToDefault(templateData.data.config[ids[0]],
      tempDataSource);

    // console.log("Binhnt.ChildComp: newTempDataSource = ", newTempDataSource);
    // console.log("Binhnt.ChildComp: ids[1] = ", ids[1]);

    let currentEditTemplateData = getDataSourceValue(ids[1], newTempDataSource);
    // console.log("Binhnt.ChildComp: currentEditTemplateData = ", currentEditTemplateData);

    const idChildArray = ids[1].split('&');

    console.log("Binhnt.ChildComp: idChildArray = ", idChildArray);


    const childIsArray = currentEditTemplateData && Array.isArray(currentEditTemplateData.children);

    console.log("Binhnt.ChildComp: childIsArray = ", childIsArray);

    const parentIsArray = idChildArray[idChildArray.length - 1].indexOf('array_name') >= 0;
    if ((!childIsArray && !parentIsArray) || isNoShow) {
      return null;
    }
    this.editAddDefault = null;
    let childKey = 'children';

    // When the child and parent are arrays, the parent array structure is displayed
    if (parentIsArray) {
      // console.log("Binhnt.ChildComp: parentIsArray");
      idChildArray.splice(idChildArray.length - 1, 1);
      childKey = idChildArray.splice(idChildArray.length - 1, 1)[0];

      if (!parentDom) {
        return null;
      }

      const parentEdit = parentDom.getAttribute('data-edit');
      // console.log("Binhnt.ChildComp: parentEdit = ", parentEdit);

      if (parentEdit) {
        parentEdit.split(',').forEach((c) => {
          if (addDefault[c.trim()]) {
            this.editAddDefault = addDefault[c];
          }
        });
      } else {
        idChildArray.forEach((c) => {
          if (addDefault[c]) {
            this.editAddDefault = addDefault[c];
          }
        });
      }

      ids[1] = idChildArray.join('&');
      // console.log("Binhnt.ChildComp: new ids[1] = ", ids[1]);
      currentEditTemplateData = getDataSourceValue(ids[1], newTempDataSource);
      // console.log("Binhnt.ChildComp: new currentEditTemplateData = ", currentEditTemplateData);

    } else {
      currentEditArray.forEach((c) => {
        if (addDefault[c]) {
          this.editAddDefault = addDefault[c];
        }
      });
    }

    const childrenToRender = currentEditTemplateData[childKey].filter((c) => c && !c.delete).map((item) => {
      return (
        <div key={item.name} className="sort-manage">
          <div className="sort-manage-name">
            {item.name}
          </div>
          <div className="sort-manage-delete">
            <Button
              onClick={() => {
                this.onSlideDelete(item, ids, currentEditTemplateData, childKey);
              }}
              size="small"
              shape="circle"
              icon={<DeleteOutlined />}
              disabled={currentEditTemplateData[childKey].length === 1}
            />
          </div>
        </div>
      );
    });


    //binhnt: main component render 
    return (
      <Collapse bordered={false} defaultActiveKey={['1']} className="child-wrapper">
        <Panel
          header={(
            <FormattedMessage id="app.edit.children.header" />
          )}
          key="1"
        >
          <Row gutter={8}>
            <Col span={24}>
              <ListSort
                dragClassName="list-drag-selected"
                className="sort-manage-list"
                key="list"
                dragElement={(
                  <div className="sort-manage-icon">
                    <BarsOutlined />
                  </div>
                )}
                onChange={(e) => {
                  this.onListChange(e, ids, currentEditTemplateData, childKey);
                }}
              >
                {childrenToRender}
              </ListSort>
            </Col>
          </Row>

          {this.editAddDefault ? (
            <Row className={this.editAddDefault ? 'add-type' : ''}>
              <Col span={6}>
                <FormattedMessage id="app.edit.children.type" />
              </Col>
              <Col span={18}>
                <Select defaultValue={this.editAddDefault[0]} size="small" onChange={this.onAddSelect}>
                  {this.editAddDefault.map((c) => (
                    <Option value={c} key={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          ) : (
            <div style={{ margin: '8px 0' }}>
              <ExclamationCircleOutlined />
              {' '}
              <FormattedMessage id="app.edit.children.remarks" />
            </div>
          )}

          <Row gutter={8}>
            <Col span={24}>
              <a
                onClick={() => {
                  this.onAdd(ids, currentEditTemplateData, childKey);
                }}
                className="add-button"
              >
                <PlusOutlined />
              </a>
            </Col>
          </Row>
        </Panel>
      </Collapse>
    );
  }
}
