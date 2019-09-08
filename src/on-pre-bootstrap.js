const _ = require(`lodash`);

const { safeLoadAllAttributesCache } = require(`./asciidoc-attributes`);
const {
  updatePageAttributesField,
  hasUpdatedPageAttributePrefix,
} = require(`./page-attributes-field`);
const { loadOptions } = require(`./plugin-options`);

async function onPreBootstrap(
  { pathPrefix, getNodesByType, cache, createContentDigest },
  configOptions
) {
  const pageAttributePrefix = loadOptions(
    _.cloneDeep(configOptions),
    pathPrefix
  );

  const updateNode = await (async () => {
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
