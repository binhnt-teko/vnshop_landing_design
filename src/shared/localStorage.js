import store from 'store';

/**
 * Auth
 */

export function getUserAuthState(userId) {
  return !!store.get(`antd-landing-login-${userId}`);
}

export function setUserAuthState(userId, state) {
  store.set(`antd-landing-login-${userId}`, state);
}

/**
 * User
 */

export function getUserTemplateIds(userId) {
  const value = store.get(userId, []);
  return typeof value === 'string' ? value.split(',').filter((c) => c) : value;
}

export function unshiftToUserTemplateIds(userId, tid) {
  const ids = getUserTemplateIds(userId);
  store.set(userId, [tid, ...ids]);
}

export function removeUserTemplateIds(userId) {
  store.remove(userId);
}

export function removeUserTemplate(userId, tid) {
  const ids = getUserTemplateIds(userId);
  store.set(userId, ids.filter((id) => id !== tid));
}

/**
 * Template
 */

export function getTemplate(tid) {
  return store.get(tid, undefined);
}

export function saveTemplate(template) {
  store.set(template.id, template);
}

export function removeTemplate(tid) {
  store.remove(tid);
}

//binhnt add to fix error 
export function getCurrentData() {

  return getTemplate(1);
}
export function pushToHistory(template) {
  store.set(template.id, template);
}
export function removeHistoryAfter(data) {
  // store.remove(tid);
}

export function saveCurrentData(template) {
  store.set(template.id, template);
}