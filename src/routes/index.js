import React from 'react';

import Homepage from '../pages/preview/index';
import List from '../pages/home/index';

const routes = [
  {
    path: '/',
    component: { Homepage }
  },
  {
    path: '/list',
    component: { List }
  },
];
export default routes;
