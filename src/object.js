const isObject = value => {
  return Object.prototype.toString.call(value) === `[object Object]`;
};
const hasProperty = (object, key) => {
  return Object.prototype.hasOwnProperty.call(object, key);
};

module.exports = {
  isObject,
  hasProperty,
};
