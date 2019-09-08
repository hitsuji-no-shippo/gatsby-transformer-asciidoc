const {
  extractPageAttributes,
  loadEmptyAttributeFieldNames,
} = require(`./asciidoc-attributes`);
const { safeLoadCache, updateCache } = require(`./cache`);

let pageAttributePrefix;

const setPageAttributePrefix = prefix => {
  pageAttributePrefix = prefix;
};

async function hasUpdatedPageAttributePrefix(prefix, cache) {
  return updateCache(prefix, `page-attribute-prefix`, cache);
}

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
  hasUpdatedPageAttributePrefix,
  loadPageAttributesField,
  setEmptyAttributeFieldNamesWithinPageAttributesCache,
  safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache,
  updatePageAttributesField,
};
