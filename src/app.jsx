import React from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { ConfigProvider } from 'antd';


import zhCN from 'antd/es/locale/zh_CN';
import enLocale from './lang/en-US';
// import cnLocale from './lang/zh-CN';

import Layout from './layout';

import store from './shared/redux';
// import { isZhCN } from './share/theme.template.utils';
import './static/style';

const props = {};

class App extends React.Component {
    constructor(props) {
        super(props);
        console.log("binhnt.App: props = ", props);
        // const { pathname } = props.location;
        // const appLocale = isZhCN(pathname) ? cnLocale : enLocale;
        const appLocale = enLocale;
        this.state = {
            appLocale,
        };
        // console.log("binhnt: " + JSON.stringify(this.props));
    }

    render() {
        const { appLocale } = this.state;
        return (
            <Provider store={store}>
                <IntlProvider locale={appLocale.locale} messages={appLocale.messages}>
                    <ConfigProvider locale={appLocale.locale === 'zh-CN' ? zhCN : null}>
                        <Layout {...this.props} >
                        </Layout>
                    </ConfigProvider>
                </IntlProvider>
            </Provider>
        );
    }
}

export default App;
