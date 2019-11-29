const {
  extractAttributes,
  loadEmptyAttributeFieldNames,
} = require(`./asciidoc-attributes`);
const { safeLoadCache } = require(`./cache`);

let pageAttributePrefix = /^page-/;

const setPageAttributePrefix = prefix => {
  if (typeof prefix === `string`) {
    pageAttributePrefix = prefix === `` ? `` : new RegExp(`^${prefix}`);
  }
};

const loadPageAttributesField = attributes => {
  return extractAttributes(attributes, pageAttributePrefix);
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

const updatePageAttributesField = (node, attributes, cache) => {
  Object.assign(node, { pageAttributes: loadPageAttributesField(attributes) });

  setEmptyAttributeFieldNamesWithinPageAttributesCache(
    loadEmptyAttributeFieldNames(node.pageAttributes),
    node.id,
    cache
  );
};

module.exports = {
  setPageAttributePrefix,
  loadPageAttributesField,
  setEmptyAttributeFieldNamesWithinPageAttributesCache,
  safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache,
  updatePageAttributesField,
};
