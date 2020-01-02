const isObject = value => {
  return Object.prototype.toString.call(value) === `[object Object]`;
};
const hasProperty = (object, key) => {
  return Object.prototype.hasOwnProperty.call(object, key);
};
const getProperty = (object, keyPath) => {
  let value = object;

  keyPath.split('.').some(key => {
    value = hasProperty(value, key) ? value[key] : null;

    return !isObject(value);
  });

  return value || null;
};

module.exports = {
  isObject,
  hasProperty,
  getProperty,
};
