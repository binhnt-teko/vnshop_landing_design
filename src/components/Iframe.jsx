import React from 'react';
import { connect } from 'react-redux';
import { polyfill } from 'react-lifecycles-compat';
import { mapStateToProps } from '../shared/utils';
import * as actions from '../shared/redux/actions';

class Iframe extends React.Component {
  static getDerivedStateFromProps(props, { prevProps, $self }) {
    const nextState = {
      prevProps: props,
    };
    if (prevProps && props !== prevProps) {
      $self.updatePost(props);
    }
    return nextState;
  }

  constructor(props) {
    super(props);
    this.state = {
      $self: this,
    };
  }

  updatePost({ templateData }) {
    const { type } = templateData;
    // console.log('数据加载状态:', templateData.type);
    if (type === 'success'
      && this.iframe.contentWindow
      && this.iframe.contentWindow.postMessage) {
      // 与 iframe 通信；
      // console.log('与 iframe 通信成功', templateData);
      this.iframe.contentWindow.postMessage(templateData, '*');
    }
  }

  getData = () => {
    const { dispatch, templateData } = this.props;
    // console.log('iframe 加载状态:', templateData.type);
    if (templateData.type === 'success') {
      this.updatePost(this.props);
    } else {
      dispatch(actions.getUserData());
    }
  }

  render() {
    const { templateData, className, mediaStateSelect } = this.props;
    const { type, uid } = templateData;
    const location = window.location;
    const protocol = location.protocol;
    // const isLocalMode = location.port;
    // const port = isLocalMode ? ':7113' : '';
    // const mainPath = isLocalMode ? '' : '/templates';

    //binhnt 
    const isLocalMode = false;
    const port = location.port;
    const mainPath = '/templates';
    const src = `${protocol}//${location.hostname}:${port}${mainPath}`;
    console.log("Binhnt:  Iframe source: " + src);

    let iframeSrc = src;
    if (type === 'success') {
      // Refresh props in iframe through routing;
      const refresh_src = `${protocol}//${location.hostname}:${port}${mainPath}/#uid=${uid}`;
      iframeSrc = refresh_src;
    }
    return (
      <iframe
        src={iframeSrc}
        title="template"
        onLoad={this.getData}
        id="myIframe"
        style={this.props.style}
        ref={(c) => {
          this.iframe = c;
        }}
        className={`${className}${mediaStateSelect === 'Mobile' ? ' mobile' : ''}`}
      />
    );
  }
}

export default connect(mapStateToProps)(polyfill(Iframe));
