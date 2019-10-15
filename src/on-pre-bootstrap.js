const { updateAsciidocFields } = require(`./asciidoc-node`);
const { safeLoadAllAttributesCache } = require(`./asciidoc-attributes`);
const { updatePageAttributesField } = require(`./page-attributes-field`);
const { setOptions } = require(`./options`);

async function onPreBootstrap(
  { pathPrefix, getNodesByType, cache, createContentDigest },
  configOptions
) {
  const isCacheEqual = await setOptions(configOptions, pathPrefix, cache);

  const updateNode = await (async () => {
    if (!isCacheEqual.asciidoctorConvert) {
      return async node => {
        updateAsciidocFields(node, cache);
      };
    }
    if (!isCacheEqual.pageAttributePrefix) {
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
