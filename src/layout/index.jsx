import React from 'react';
import { message, Button, Input, Form, notification } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, LockOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';

import { getNewHref } from '../share/utils';
import { mapStateToProps, logIn } from '../shared/utils';
import * as actions from '../shared/redux/actions';

import NewFileButton from '../components/NavController/NewFileButton';
import NavController from '../components/NavController';
import SideMenu from '../components/SideMenu';
import EditInfluence from '../components/EditInfluence';
import Iframe from '../components/Iframe';
import EditStageController from '../components/EditStageController';
import EditListController from '../components/EditListController';

const FormItem = Form.Item;

class Layout extends React.PureComponent {
  state = {
    loading: false,
    sideMenuOpen: false,
    rightMenuOpen: true,
  }

  formRef = React.createRef();

  constructor(props) {
    super(props);
    const { dispatch } = props;
    dispatch(actions.getUserData());
  }

  componentDidMount() {
    const date = new Date();
    const endDate = new Date('2019/11/29 23:59:59');
    if (endDate.getTime() - date.getTime() > 0) {
      notification.open({
        placement: 'bottomRight',
        duration: 10000,
        message: this.props.intl.formatMessage({ id: 'app.layout.notification.title' }),
        description: (
          <div>
            {this.props.intl.formatMessage({ id: 'app.layout.notification.content' })}
          </div>
        ),
      });
    }
    this.forceUpdate();
  }

  onLogin = (values) => {
    console.log("binhnt. Layout: onLogin");
    const { templateData, dispatch } = this.props;
    const id = templateData.data.user.userId;
    this.setState({
      loading: true,
    }, () => {
      console.log("binhnt. Layout: onLogin after update state ");
      logIn(values.password, id, (succeeded) => {
        if (succeeded) {
          dispatch(actions.setUserData(true));
          message.success('登入成功。');
        } else {
          this.formRef.current.setFields([
            {
              name: 'password',
              value: values.password,
              errors: ['Password error.'],
            },
          ]);
        }
        this.setState({
          loading: false,
        });
      });
    });
  }
  onSideMenuOpen = (event) => {
    console.log("Binhnt.layout: onSideMenuOpen", event);
    this.setState({
      sideMenuOpen: !this.state.sideMenuOpen,
    })

  }

  onRightMenuOpen = (event) => {
    console.log("Binhnt.layout: onRightMenuOpen", event);
    this.setState({
      rightMenuOpen: event,
    })

  }

  getLoginForm() {
    return (
      <div className={`login-view${passwordNo ? ' password-no' : ''}`}>
        <a href={getNewHref('7111', null, true)} target="_blank" className="header">
          <img
            src="https://gw.alipayobjects.com/zos/rmsportal/SVDdpZEbAlWBFuRGIIIL.svg"
            alt="logo"
            width="20"
          />
        </a>
        <Form onFinish={this.onLogin} ref={this.formRef}>
          <p>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            <FormattedMessage id="app.login.title" />
          </p>
          <FormItem
            name="password"
            rules={[
              { required: true, message: 'Password must be at least 6 characters.' },
              { min: 6, message: 'Password must be at least 6 characters.' },
            ]}
          >
            <Input
              prefix={<LockOutlined type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
              type="password"
              placeholder="Password"
            />
          </FormItem>
          <FormItem shouldUpdate>
            {
              () => (
                <Button
                  loading={this.state.loading}
                  disabled={!this.formRef.current
                    || !this.formRef.current.isFieldsTouched(true)
                    || this.formRef.current.getFieldsError().filter(({ errors }) => errors.length).length}
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                >
                  <FormattedMessage id="app.common.ok" />
                </Button>
              )
            }
          </FormItem>
        </Form>
        <div>
          <p>
            <WarningOutlined />
            {' '}
            <FormattedMessage id="app.login.noPassword" />
          </p>
          <NewFileButton>
            <Button style={{ width: '100%' }}><FormattedMessage id="app.login.new" /></Button>
          </NewFileButton>
        </div>
      </div>
    )
  }
  render() {
    const { templateData, userIsLogin } = this.props;

    console.log("Binhnt.edit.template.layout.render: userIsLogin = ", userIsLogin)
    if (!templateData.data) {
      return (
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          Loading...
        </div>
      );
    }

    //binhnt: Check login 
    if (templateData.data.user && templateData.data.user.userId && !templateData.data.user.delete && !userIsLogin) {
      console.log("Binhnt.edit.template.layout.render: templateData.data.user = ", templateData.data.user)
      let passwordNo;
      if (this.formRef.current) {
        passwordNo = this.formRef.current.getFieldsError(['password'])
          .filter(({ errors }) => errors.indexOf('Password error.') >= 0).length;
      }

      const loginForm = this.getLoginForm()
      return (
        <div className="login-controller" key="1">
          { loginForm}
        </div>
      );
    }

    //binhnt: Return default 
    const widthStage = this.state.sideMenuOpen ? "calc(100% - 400px)" : "calc(100% - 40px)";
    const leftMarginStage = this.state.sideMenuOpen ? "400px" : "40px";

    // console.log("binhnt.layout: render: widthStage = ", widthStage, leftMarginStage);

    const displayRightMenu = this.state.rightMenuOpen ? "block" : "none";
    const widthLeftView = this.state.rightMenuOpen ? "calc(100% - 288px)" : "100%";
    console.log("binhnt.layout: render: displayRightMenu = ", displayRightMenu, widthLeftView);

    return (
      <div className="edit-wrapper" key="2">
        <div className="edit-left-view" style={{ width: widthLeftView }} >
          <NavController {...this.props} onRightMenuOpen={this.onRightMenuOpen} />
          <div className="edit-content-wrapper">
            <SideMenu {...this.props} onSideMenuOpen={this.onSideMenuOpen} />
            <div className="edit-stage-wrapper" style={{ width: widthStage, marginLeft: leftMarginStage }} >
              <EditInfluence {...this.props} />
              <Iframe
                className="edit-preview"
              />
              <EditStageController {...this.props} />
            </div>
          </div>
        </div>
        <div className="edit-right-view" style={{ display: displayRightMenu }} >
          <EditListController {...this.props} />
        </div>
      </div>
    );
  }
}

export default injectIntl(connect(mapStateToProps)(Layout));
