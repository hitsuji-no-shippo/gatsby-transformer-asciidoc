// There is no way to preserve empty attribute names other than global
// variables. (refactor #13)
const emptyAttributeFieldNamesWithinAllNodesPageAttributes = new Set([]);
const EMPTY_ATTRIBUTE_VALUE = '';
module.exports = {
  emptyAttributeFieldNamesWithinAllNodesPageAttributes,
  EMPTY_ATTRIBUTE_VALUE,
};
