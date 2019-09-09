const _ = require(`lodash`);

const { hasUpdatedAsciidocFields } = require(`./asciidoctor`);
const { updateAsciidocFields } = require(`./asciidoc-node`);
const { safeLoadAllAttributesCache } = require(`./asciidoc-attributes`);
const {
  updatePageAttributesField,
  hasUpdatedPageAttributePrefix,
  setPageAttributePrefixCache,
} = require(`./page-attributes-field`);
const { loadOptions } = require(`./plugin-options`);

async function onPreBootstrap(
  { pathPrefix, getNodesByType, cache, createContentDigest },
  configOptions
) {
  const { pageAttributePrefix, asciidoctorOptions } = loadOptions(
    _.cloneDeep(configOptions),
    pathPrefix
  );

  const updateNode = await (async () => {
    if (await hasUpdatedAsciidocFields(asciidoctorOptions, cache)) {
      setPageAttributePrefixCache(pageAttributePrefix, cache);

      return async node => {
        updateAsciidocFields(node, cache);
      };
    }
    if (await hasUpdatedPageAttributePrefix(pageAttributePrefix, cache)) {
      return async node => {
        const allAttributes = await safeLoadAllAttributesCache(node, cache);

        updatePageAttributesField(node, allAttributes, cache);
      };
    }

    return null;
  })();

  if (updateNode) {
    const updates = getNodesByType(`Asciidoc`).reduce((updateNodes, node) => {
      updateNodes.add(
        new Promise(resolve => {
          updateNode(node);

          {
            const { internal } = node;
            internal.contentDigest = createContentDigest(node);
          }

          resolve();
        })
      );

      return updateNodes;
    }, new Set());

    await Promise.all(updates);
  }
}

module.exports = onPreBootstrap;
