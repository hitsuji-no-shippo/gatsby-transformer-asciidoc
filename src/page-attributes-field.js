const yaml = require(`js-yaml`);

// There is no way to preserve empty attribute names other than global
// variables. (refactor #13)
const emptyAttributeFieldNamesWithinAllNodesPageAttributes = new Set([]);
const EMPTY_ATTRIBUTE_FIELD_VALUE = null;

let pageAttributePrefix;

const setPageAttributePrefix = prefix => {
  pageAttributePrefix = prefix;
};

const extractPageAttributes = (attributes, namePattern) => {
  const convertNameFromAttributeToFiled = attribute => {
    // GraphQL field Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ ,
    // so replace `-` with `_` .
    return attribute.replace(/-/g, `_`);
  };
  const extractsAttribute = namePattern instanceof RegExp;
  const emptyAttributeValue = '';

  return Object.entries(attributes).reduce((attributeFields, [key, value]) => {
    let attributeName = key;

    if (extractsAttribute) {
      attributeName = attributeName.replace(namePattern, ``);

      if (attributeName === key) {
        return attributeFields;
      }
    }

    const fields = attributeFields;

    // If the value uses {} or [], the following error will occur,
    // so enclose the safeLoad() argument in quotation.
    // YAMLException: end of the stream or a document separator is expected ...
    fields[convertNameFromAttributeToFiled(attributeName)] =
      value === emptyAttributeValue
        ? EMPTY_ATTRIBUTE_FIELD_VALUE
        : yaml.safeLoad(`'${value}'`);

    return fields;
  }, {});
};

const loadPageAttributesField = attributes => {
  return extractPageAttributes(attributes, pageAttributePrefix);
};

const registerEmptyAttributeFieldNamesInPageAttributes = node => {
  Object.entries(node.pageAttributes).forEach(([name, value]) => {
    if (value === EMPTY_ATTRIBUTE_FIELD_VALUE) {
      emptyAttributeFieldNamesWithinAllNodesPageAttributes.add(name);
    }
  });
};

module.exports = {
  emptyAttributeFieldNamesWithinAllNodesPageAttributes,
  EMPTY_ATTRIBUTE_FIELD_VALUE,
  setPageAttributePrefix,
  loadPageAttributesField,
  registerEmptyAttributeFieldNamesInPageAttributes,
};
