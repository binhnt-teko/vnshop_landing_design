import React from 'react';
import { Tooltip, Modal, Button, Form, Input, message } from 'antd';
import {
  ExclamationCircleOutlined,
  LockOutlined,
  WarningOutlined,
  PlusCircleOutlined,
  UnlockOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  VideoCameraOutlined,
  FolderAddOutlined,

} from '@ant-design/icons';


import DrawerMenu from 'rc-drawer';
import { FormattedMessage, injectIntl } from 'react-intl';

import webData from '../config/template.config';
import landingData from '../config/landing.config';
import { getNewHref } from '../share/utils';
import * as utils from '../share/theme.template.utils';
import * as actions from '../shared/redux/actions';

const FormItem = Form.Item;

class SideMenu extends React.PureComponent {
  state = {
    editMenuOpen: false,
    landingListOpen: false,
    contentAddMode: false,
    lockModalShow: false,
  }

  formRef = React.createRef();

  getContentDrawer = (isZhCN) => {
    const children = [];
    const pushData = (child, i, key, item) => {
      if (child.disabled) {
        return null;
      }
      const img = child.isVideo ? (
        <video src={child.src} width="100%" height="100%" autoPlay loop>
          <track kind="captions" />
        </video>
      )
        : <img src={child.src} width="100%" alt="img" draggable="false" />;
      children.push((
        <div
          className="img-wrapper"
          key={`${key}${'uid' in child ? child.uid : i}`}
          data-key={`${key}${'uid' in child ? child.uid : i}`}
        >
          <Tooltip
            placement="right"
            title={(
              <div style={{ width: 500 }}>
                {img}
              </div>
            )}
            overlayStyle={{ maxWidth: 'none' }}
          >
            <div className="img">
              {img}
            </div>
          </Tooltip>
          <p>
            {item.name}
            {child.uid}
            {' '}
            -
            {' '}
            {child[`text${isZhCN ? '' : 'En'}`]}
          </p>
        </div>
      ));
    };
    Object.keys(webData).sort((a, b) => (webData[a].order - webData[b].order))
      .forEach((key) => {
        if (key !== 'Other') {
          const item = webData[key];
          children.push((
            <div className="title" key={key}>
              {item.name}
            </div>));
          item.data // .sort((a, b) => (a.order - b.order))
            .forEach((child, i) => {
              pushData(child, i, key, item);
            });
        }
      });
    return children;
  }
  getLandingDrawer = (isZhCN) => {
    const children = [];
    const pushData = (child, i, key, item) => {
      if (child.disabled) {
        return null;
      }
      const img = child.isVideo ? (
        <video src={child.src} width="100%" height="100%" autoPlay loop>
          <track kind="captions" />
        </video>
      )
        : <img src={child.src} width="100%" alt="img" draggable="false" />;
      children.push((
        <div
          className="img-wrapper"
          key={`${key}${'uid' in child ? child.uid : i}`}
          data-key={`${key}${'uid' in child ? child.uid : i}`}
        >
          <Tooltip
            placement="right"
            title={(
              <div style={{ width: 500 }}>
                {img}
              </div>
            )}
            overlayStyle={{ maxWidth: 'none' }}
          >
            <div className="img">
              {img}
            </div>
          </Tooltip>
          <p>
            {item.name}
            {child.uid}
            {' '}
            -
            {' '}
            {child[`text${isZhCN ? '' : 'En'}`]}
          </p>
        </div>
      ));
    };
    Object.keys(landingData).sort((a, b) => (landingData[a].order - landingData[b].order))
      .forEach((key) => {
        if (key !== 'Other') {
          const item = landingData[key];
          children.push((
            <div className="title" key={key}>
              {item.name}
            </div>));
          item.data // .sort((a, b) => (a.order - b.order))
            .forEach((child, i) => {
              pushData(child, i, key, item);
            });
        }
      });
    return children;
  }

  showMenu = () => {
    console.log("binhnt.SideMenu: Click => showMenu => update editMenuOpen")

    const { onSideMenuOpen } = this.props;
    if (onSideMenuOpen !== undefined) {
      onSideMenuOpen(!this.state.editMenuOpen)
    }

    this.setState({
      editMenuOpen: !this.state.editMenuOpen,
      landingListOpen: false,
    });
  }
  showComponentForm = () => {
    this.setState({
      lockModalShow: false,
      contentAddMode: !this.state.contentAddMode,
    });
  }
  showLandingList = () => {

    const { onSideMenuOpen } = this.props;
    if (onSideMenuOpen !== undefined) {
      onSideMenuOpen(!this.state.landingListOpen)
    }

    this.setState({
      editMenuOpen: false,
      landingListOpen: !this.state.landingListOpen,
    });
  }

  // hideMenu = () => {
  //   this.setState({
  //     editMenuOpen: false,
  //   });
  // }

  onLockData = () => {
    this.setState({
      lockModalShow: !this.state.lockModalShow,
      contentAddMode: false,
    });
  }

  onLandingData = () => {
    console.log("binhnt: Disable dialog")
    this.setState({
      contentAddMode: !this.state.contentAddMode,
      lockModalShow: false,
    });
  }
  handleProcessLanding = () => {
    console.log("binhnt: SideMenu: handleProcessLanding")

    this.setState({
      contentAddMode: false,
      lockModalShow: false,
    });
  }
  onSignUp = (value) => {
    const { templateData, dispatch } = this.props;

    templateData.data.user = templateData.data.user || {
      username: templateData.uid,
      userId: null,
    };
    templateData.data.user.password = value.password;
    delete templateData.data.user.delete;
    if (this.formRef.current) {
      this.formRef.current.resetFields();
    }
    this.onLockData();
    dispatch(actions.setUserAndTemplateData({ userIsLogin: true, templateData }));

    message.success(
      this.props.intl.formatMessage({ id: 'app.side.encryption.message' })
    );
  }

  oonUnLockData = () => {
    const { templateData, dispatch } = this.props;

    if (templateData.data.user && templateData.data.user.userId) {
      templateData.data.user.delete = true;
    } else {
      delete templateData.data.user;
    }
    dispatch(actions.setUserAndTemplateData({ userIsLogin: false, templateData }));

    message.success(
      this.props.intl.formatMessage({ id: 'app.side.decrypt.message' })
    );
  }

  getPasswordFormChild = () => {
    return (
      <Form ref={this.formRef} onFinish={this.onSignUp}>
        <p style={{ marginBottom: '1em' }}>
          <ExclamationCircleOutlined style={{ marginRight: 8 }} />
          <FormattedMessage id="app.side.encryption.remarks" />
        </p>
        <FormItem
          name="password"
          rules={[
            { required: true, message: 'Password must be at least 6 characters.' },
            { min: 6, message: 'Password must be at least 6 characters.' },
          ]}
        >
          <Input
            prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            type="password"
            placeholder="Password"
          />
        </FormItem>
        <FormItem style={{ marginBottom: 0 }} shouldUpdate>
          {
            () => (
              <Button
                disabled={!this.formRef.current
                  || !this.formRef.current.isFieldsTouched(true)
                  || this.formRef.current.getFieldsError().filter(({ errors }) => errors.length).length}
                type="primary"
                htmlType="submit"
              >
                <FormattedMessage id="app.common.ok" />
              </Button>
            )
          }
        </FormItem>
        <p>
          <WarningOutlined style={{ marginRight: 8 }} />
          <FormattedMessage id="app.side.encryption.remarks2" />
        </p>
      </Form>
    );
  }

  getLandingFormChild = () => {
    return (
      <Form ref={this.formRef} onFinish={this.onSignUp}>
        <p style={{ marginBottom: '1em' }}>
          <ExclamationCircleOutlined style={{ marginRight: 8 }} />
          <FormattedMessage id="app.side.encryption.remarks" />
        </p>
        <FormItem
          name="password"
          rules={[
            { required: true, message: 'Password must be at least 6 characters.' },
            { min: 6, message: 'Password must be at least 6 characters.' },
          ]}
        >
          <Input
            prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
            type="password"
            placeholder="Password"
          />
        </FormItem>
        <FormItem style={{ marginBottom: 0 }} shouldUpdate>
          {
            () => (
              <Button
                disabled={!this.formRef.current
                  || !this.formRef.current.isFieldsTouched(true)
                  || this.formRef.current.getFieldsError().filter(({ errors }) => errors.length).length}
                type="primary"
                htmlType="submit"
              >
                <FormattedMessage id="app.common.ok" />
              </Button>
            )
          }
        </FormItem>
        <p>
          <WarningOutlined style={{ marginRight: 8 }} />
          <FormattedMessage id="app.side.encryption.remarks2" />
        </p>
      </Form>
    );
  }
  handleLangChange = () => {
    // const { pathname } = this.props.history.location;

    const currentProtocol = `${window.location.protocol}//`;
    const currentHref = window.location.href.substr(currentProtocol.length);
    // const isZhCN = utils.isZhCN(pathname);
    //binhnt
    const isZhCN = false;
    if (utils.isLocalStorageNameSupported()) {
      localStorage.setItem('locale', isZhCN ? 'en-US' : 'zh-CN');
    }

    window.location.href = currentProtocol + currentHref.replace(
      window.location.pathname,
      utils.getLocalizedPathname(
        isZhCN ? window.location.pathname : `${window.location.pathname}index`,
        !isZhCN
      ),
    );
  }

  render() {
    const { templateData, location } = this.props;
    const isLock = templateData.data
      && templateData.data.user
      && templateData.data.user.username
      && !templateData.data.user.delete;

    const passwordFormChild = this.getPasswordFormChild();
    const landingFormChild = this.getLandingFormChild();

    // const isZhCN = utils.isZhCN(location.pathname);
    const isZhCN = false;

    const drawerContentChild = this.getContentDrawer(isZhCN);
    const drawerLandingChild = this.getLandingDrawer(isZhCN);
    return (
      <div
        className="edit-side-menu-wrapper"
      // onMouseLeave={this.hideMenu}
      >
        {/* binhnt:  List of compoents */}
        <DrawerMenu
          level={null}
          getContainer={null}
          handler={null}
          open={this.state.editMenuOpen}
          wrapperClassName="edit-side-drawer"
        >
          <div className="img-content-wrapper">
            {drawerContentChild}
          </div>
        </DrawerMenu>

        {/* binhnt:  List of user landing pages */}
        <DrawerMenu
          level={null}
          getContainer={null}
          handler={null}
          open={this.state.landingListOpen}
          wrapperClassName="edit-side-drawer"
        >
          <div className="img-content-wrapper">
            {drawerLandingChild}
          </div>
        </DrawerMenu>


        <div className="edit-side-menu">
          {
            // <div className={isZhCN ? 'add add-zh' : 'add'} onMouseEnter={this.showMenu}>
            <div className={'add'} onClick={this.showMenu}>
              <FolderAddOutlined />
              <FormattedMessage id="app.side.content" />
            </div>

          }
          {
            // <div className={isZhCN ? 'add add-zh' : 'add'} onMouseEnter={this.showMenu}>
            <div className={'add'} onClick={this.showComponentForm}>
              <PlusCircleOutlined />
              <FormattedMessage id="app.side.add" />
            </div>
          }
          {
            // <div className={isZhCN ? 'add add-zh' : 'add'} onMouseEnter={this.showMenu}>
            <div className={'add'} onClick={this.showLandingList}>
              <FolderOpenOutlined />
              <FormattedMessage id="app.side.landing" />
            </div>

          }

          {/* <ul className="other" onMouseEnter={this.hideMenu}> */}
          <ul className="other">
            {/* <Tooltip title={<FormattedMessage id="app.side.lang" />} placement="right">
              <li onClick={this.handleLangChange}>
                {isZhCN ? 'En' : 'Zh'}
              </li>
            </Tooltip> */}
            <Tooltip title={isLock ? <FormattedMessage id="app.side.decrypt" />
              : <FormattedMessage id="app.side.encryption" />}
              placement="right"
            >
              <li onClick={isLock ? this.oonUnLockData : this.onLockData}>
                {isLock ? <LockOutlined /> : <UnlockOutlined />}
              </li>
            </Tooltip>

            {/* <Tooltip title={<FormattedMessage id="app.side.umi-example" />} placement="right">
              <li>
                <a href="https://github.com/ant-motion/landing-umi-example" target="_blank">
                  <FolderOutlined />
                </a>
              </li>
            </Tooltip> */}
            <Tooltip title={<FormattedMessage id="app.side.video-help" />} placement="right">
              <li>
                <a href={`${getNewHref('7111', '', true, '/docs/edit/video')}`} target="_blank">
                  <VideoCameraOutlined />
                </a>
              </li>
            </Tooltip>
            <Tooltip title={<FormattedMessage id="app.side.help" />} placement="right">
              <li>
                <a href={`${getNewHref('7111', '', true, '/docs/edit/edit-block')}`} target="_blank">
                  <ExclamationCircleOutlined />
                </a>
              </li>
            </Tooltip>
          </ul>
        </div>
        <Modal
          title={<FormattedMessage id="app.side.encryption" />}
          visible={this.state.lockModalShow}
          width={400}
          footer={null}
          onCancel={this.onLockData}
          wrapClassName="password-modal"
        >
          {passwordFormChild}
        </Modal>

        <Modal
          title={<FormattedMessage id="app.side.add" />}
          visible={this.state.contentAddMode}
          width={400}
          footer={null}
          wrapClassName="landing-add-modal"
          onCancel={this.onLandingData}
          onOk={this.handleProcessLanding}
        >
          {landingFormChild}
        </Modal>

      </div>
    );
  }
}


export default injectIntl(SideMenu);
