import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router'
import history from './history'
import { Route, Switch } from 'react-router-dom'

// import Homepage from './pages/preview/index'
// import './index.css';

import App from './app';
ReactDOM.render(
  // <React.StrictMode>
  <Router history={history} >
    <Switch>
      <Route path="/" >
        <App />
      </Route>
      <Route path="/index" >
        <App />
      </Route>
    </Switch>
  </Router>
  ,
  // </React.StrictMode>,
  document.getElementById('react-content')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
