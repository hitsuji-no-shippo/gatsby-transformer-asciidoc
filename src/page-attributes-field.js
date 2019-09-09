const {
  extractPageAttributes,
  loadEmptyAttributeFieldNames,
} = require(`./asciidoc-attributes`);
const { safeLoadCache, updateCache } = require(`./cache`);

let pageAttributePrefix;

const setPageAttributePrefix = prefix => {
  pageAttributePrefix = prefix;
};

const pageAttributePrefixCacheKey = `page-attribute-prefix`;

async function hasUpdatedPageAttributePrefix(prefix, cache) {
  return updateCache(prefix, pageAttributePrefixCacheKey, cache);
}

const setPageAttributePrefixCache = (prefix, cache) => {
  cache.set(pageAttributePrefixCacheKey, prefix);
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
  setPageAttributePrefixCache,
  loadPageAttributesField,
  setEmptyAttributeFieldNamesWithinPageAttributesCache,
  safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache,
  updatePageAttributesField,
};
