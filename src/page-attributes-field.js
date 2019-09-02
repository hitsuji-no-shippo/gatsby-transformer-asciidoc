const yaml = require(`js-yaml`);

const { safeLoadCache } = require(`./cache`);

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

const loadEmptyAttributeFieldNames = attributeFields => {
  return Object.entries(attributeFields).reduce((names, [name, value]) => {
    if (value === EMPTY_ATTRIBUTE_FIELD_VALUE) {
      names.push(name);
    }

    return names;
  }, []);
};

const getEmptyAttributeFieldNamesWithinPageAttributesCacheKey = nodeId =>
  `asciidoc-node-empty-attribute-field-names-within-page-attributes-${nodeId}`;

const setEmptyAttributeFieldNamesWithinPageAttributesCache = (
  emptyAttributeFieldNames,
  nodeId,
  cache
) => {
  cache.set(
    getEmptyAttributeFieldNamesWithinPageAttributesCacheKey(nodeId),
    emptyAttributeFieldNames
  );
};

const safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache = (
  node,
  cache
) => {
  return safeLoadCache(
    getEmptyAttributeFieldNamesWithinPageAttributesCacheKey(node.id),
    cache,
    () => loadEmptyAttributeFieldNames(node.pageAttributes)
  );
};

module.exports = {
  EMPTY_ATTRIBUTE_FIELD_VALUE,
  setPageAttributePrefix,
  loadPageAttributesField,
  loadEmptyAttributeFieldNames,
  setEmptyAttributeFieldNamesWithinPageAttributesCache,
  safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache,
};
