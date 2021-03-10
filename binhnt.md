## Setup landing page
1. Copy folder /Home to src

2. Install plugin
yarn add antd enquire-js rc-queue-anim rc-scroll-anim rc-tween-one  rc-banner-anim  @ant-design/compatible --save;
yarn add babel-plugin-import --save-dev
yarn add react-app-rewired customize-cra less less-loader

3. Change the initialization configuration in the package.json file
"scripts": {
-   "start": "react-scripts start",
+   "start": "react-app-rewired start",
-   "build": "react-scripts build",
+   "build": "react-app-rewired build",
-   "test": "react-scripts test",
+   "test": "react-app-rewired test",
}
4. Create config-overrides.js
const { override, fixBabelImports, addLessLoader } = require('customize-cra');

module.exports = override(
  // Load antd
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: true,
  }),
  // Add `javascriptEnabled` and antd theme configuration
  // to the Less loader
  addLessLoader({
    lessOptions: {
      javascriptEnabled: true,
      modifyVars: { '@primary-color': '#1DA57A' },
    }
  }),
);
5. Modify the entrypoint
Open the src/index.js file and import and render the Home package.
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
- import App from './App';
+ import App from './Home';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();



open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

https://guide.teko.vn/tracking/js/#setting-up


#Config letencrypt
apk add certbot certbot-nginx
certbot --nginx -d bidv-landing.vnshop.vn -d www.bidv-landing.vnshop.vn

- Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/bidv-landing.vnshop.vn/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/bidv-landing.vnshop.vn/privkey.pem
   Your cert will expire on 2021-02-14. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot again
   with the "certonly" option. To non-interactively renew *all* of
   your certificates, run "certbot renew"
 - If you like Certbot, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
