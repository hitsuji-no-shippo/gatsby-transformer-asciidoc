const {
  extractPageAttributes,
  loadEmptyAttributeFieldNames,
} = require(`./asciidoc-attributes`);
const { safeLoadCache } = require(`./cache`);

let pageAttributePrefix;

const setPageAttributePrefix = prefix => {
  pageAttributePrefix = prefix;
};

const loadPageAttributesField = attributes => {
  return extractPageAttributes(attributes, pageAttributePrefix);
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
  setPageAttributePrefix,
  loadPageAttributesField,
  setEmptyAttributeFieldNamesWithinPageAttributesCache,
  safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache,
};
