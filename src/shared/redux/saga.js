/* eslint-disable no-console */
import { takeEvery, put } from '@redux-saga/core/effects';
import * as r from 'ramda';

import { GET_USER_DATA, POST_TYPE, CREATE_NEW_TEMPLATE, SET_TEMPLATE_DATA, CHANGE_CHILD, SET_USER_AND_TEMPLATE_DATA, UPDATE_HISTORY } from './actionTypes';
import * as actions from './actions';

import * as url from '../url';
import * as ls from '../localStorage';
import AV from '../leancloud';
import { DEFAULT_USER_NAME, DEFAULT_FILE_NAME } from '../constants';
import { xssFunc, getCurrentTemplateId, saveTemplateToLocalStorage, newTemplate } from '../utils';
import { deepCopy, setDataSourceValue } from '../../share/utils';
import defaultData from '../defaultTemplate';

let getUserDataErrorCount = 0;

//handleGetUserData: called when call get UserData
function* handleGetUserData(action) {
  const { data } = action;

  const { uid: hash, cloneId, previewId } = url.get();

  if (previewId) {
    yield put({
      type: POST_TYPE.POST_SUCCESS,
      templateData: {
        id: previewId,
        attributes: defaultData[previewId],
      },
    });
    return;
  }
  if (cloneId) {
    const d = defaultData[cloneId];
    url.update('cloneId');
    if (d) {
      yield put(actions.getUserData(d));
      return;
    }
    console.warn(`error: cloneId(${cloneId}) Incorrect, please check it.`);
  }

  /**
      * Enter the page:
      * 1. If there is a value in hash, request the value in hash. When the value does not return data, take down the value in localStorage in turn, delete it and create a new one if it is not.
      * 2. Enter the empty hash, and take down the value in localStorage one by one, without deleting it and creating a new one.
      */

  const uid = getCurrentTemplateId(hash, data);
  if (!hash && uid) {
    url.update('uid', uid);
  }
  if (!uid) {
    yield put(actions.createNewTemplate(data));
    return;
  }

  const localTemplate = ls.getTemplate(uid);
  if (localTemplate) {
    const config = r.path(['attributes', 'config'])(localTemplate);
    const userId = r.path(['attributes', 'user', 'userId'])(localTemplate);

    xssFunc(config);

    yield put({
      type: POST_TYPE.POST_SUCCESS,
      templateData: localTemplate,
      userIsLogin: ls.getUserAuthState(userId),
    });

    // Did not enter dataToLocalStorage, manually push history;
    yield put({
      type: UPDATE_HISTORY,
      data: localTemplate,
    });

    return;
  }

  const query = new AV.Query(DEFAULT_FILE_NAME);
  try {
    const template = yield query.get(uid);

    const config = r.path(['attributes', 'config'])(template);
    const userId = r.path(['attributes', 'user', 'userId'])(template);

    xssFunc(config);

    saveTemplateToLocalStorage(DEFAULT_USER_NAME, template);

    yield put({
      type: POST_TYPE.POST_SUCCESS,
      templateData: ls.getTemplate(uid),
      userIsLogin: ls.getUserAuthState(userId),
    });
    yield put({
      type: UPDATE_HISTORY,
      data: template,
    });
  } catch (error) {
    if (error.code === 101) {
      ls.removeUserTemplate(DEFAULT_USER_NAME, uid);
      url.update('uid');

      yield put(actions.getUserData());
      return;
    }

    if (error.code === -1) {
      getUserDataErrorCount += 1;
      if (getUserDataErrorCount < 3) {
        yield put(actions.getUserData());
        return;
      }

      console.error('???????????????????????????????????? uid ?????????, ??????????????????');
      return;
    }

    if (error.code === 100) {
      console.error('???????????????????????????');
    }
  }
}

//handleCreateNewTemplate: Called when yield  createNewTemplate
function* handleCreateNewTemplate(action) {
  const { data } = action;
  try {
    const template = yield newTemplate(DEFAULT_USER_NAME, data);
    yield put({
      type: POST_TYPE.POST_SUCCESS,
      templateData: template,
    });
    yield put({
      type: UPDATE_HISTORY,
      data: template,
    });
  } catch (error) {
    console.error(error);
  }
}

function* handleSetTemplateData(action) {
  const { data: { uid: id, data: attributes, noHistory } } = action;
  const data = { id, attributes, noHistory };
  saveTemplateToLocalStorage(DEFAULT_USER_NAME, data);

  yield put({
    type: POST_TYPE.SET_TEMPLATE,
    data: attributes,
  });

  yield put({
    type: UPDATE_HISTORY,
    data,
  });
}

function* handleChangeChild(action) {
  const { data: { templateData, ids, currentData } } = action;
  const newTemplateData = deepCopy(templateData);
  setDataSourceValue(ids, 'children', currentData.children, newTemplateData.data.config);
  yield put(actions.setTemplateData(newTemplateData));
}

function* handleSetUserAndTemplateData(action) {
  const { data } = action;
  const d = {
    id: data.templateData.uid,
    attributes: data.templateData.data,
  };
  saveTemplateToLocalStorage(DEFAULT_USER_NAME, d);

  yield put({
    type: POST_TYPE.SET_USERTEMPLATE,
    data,
  });
  yield put({
    type: UPDATE_HISTORY,
    data: d,
  });
}

function* handleUpdateHistory(action) {
  const { data: template } = action;
  const { noHistory } = template;
  if (!noHistory) {
    delete template.noHistory;
    yield put(actions.updateHistoryReNum(template));
  }
}

export default function* () {
  yield takeEvery(GET_USER_DATA, handleGetUserData);
  yield takeEvery(CREATE_NEW_TEMPLATE, handleCreateNewTemplate);
  yield takeEvery(SET_TEMPLATE_DATA, handleSetTemplateData);
  yield takeEvery(CHANGE_CHILD, handleChangeChild);
  yield takeEvery(SET_USER_AND_TEMPLATE_DATA, handleSetUserAndTemplateData);
  yield takeEvery(UPDATE_HISTORY, handleUpdateHistory);
}
