const yaml = require(`js-yaml`);

// There is no way to preserve empty attribute names other than global
// variables. (refactor #13)
const emptyAttributeFieldNamesWithinAllNodesPageAttributes = new Set([]);
const EMPTY_ATTRIBUTE_VALUE = '';

let pageAttributePrefix;

const setPageAttributePrefix = prefix => {
  pageAttributePrefix = prefix;
};

const extractPageAttributes = (
  attributes,
  enablesEmptyAttribute,
  namePattern
) => {
  const convertNameFromAttributeToFiled = attribute => {
    // GraphQL field Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ ,
    // so replace `-` with `_` .
    return attribute.replace(/-/g, `_`);
  };
  const extractsAttribute = namePattern instanceof RegExp;

  return Object.entries(attributes).reduce((attributeFields, [key, value]) => {
    let attributeName = key;

    if (extractsAttribute) {
      attributeName = attributeName.replace(namePattern, ``);

      if (attributeName === key) {
        return attributeFields;
      }
    }

    const fieldName = convertNameFromAttributeToFiled(attributeName);
    const loadPageAttributeValue = () => {
      if (value === EMPTY_ATTRIBUTE_VALUE && enablesEmptyAttribute) {
        emptyAttributeFieldNamesWithinAllNodesPageAttributes.add(fieldName);
        return EMPTY_ATTRIBUTE_VALUE;
      }
      return yaml.safeLoad(value);
    };
    const fields = attributeFields;

    fields[
      convertNameFromAttributeToFiled(attributeName)
    ] = loadPageAttributeValue();

    return fields;
  }, {});
};

const loadPageAttributesField = (attributes, enablesEmptyAttribute) => {
  return extractPageAttributes(
    attributes,
    enablesEmptyAttribute,
    pageAttributePrefix
  );
};

module.exports = {
  emptyAttributeFieldNamesWithinAllNodesPageAttributes,
  EMPTY_ATTRIBUTE_VALUE,
  setPageAttributePrefix,
  loadPageAttributesField,
};
