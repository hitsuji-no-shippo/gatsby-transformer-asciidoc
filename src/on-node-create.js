const { loadAsciidoc, createAsciidocNode } = require(`./asciidoctor`);
const {
  registerEmptyAttributeFieldNamesInPageAttributes,
} = require(`./page-attributes-field`);
const { pluginOptions } = require(`./plugin-options`);

async function onCreateNode({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  reporter,
  createContentDigest,
}) {
  if (!pluginOptions.supportedExtensions.includes(node.extension)) {
    return;
  }

  // Load Asciidoc contents
  const content = await loadNodeContent(node);
  // We use a `let` here as a warning: some operations,
  // like .convert() mutate the document
  const doc = await loadAsciidoc(content);
  let asciidocNode;

  try {
    asciidocNode = createAsciidocNode(
      content,
      doc,
      node.id,
      createNodeId,
      createContentDigest
    );

    const { createNode, createParentChildLink } = actions;

    createNode(asciidocNode);
    createParentChildLink({ parent: node, child: asciidocNode });
  } catch (err) {
    reporter.panicOnBuild(
      `Error processing Asciidoc ${
        node.absolutePath ? `file ${node.absolutePath}` : `in node ${node.id}`
      }:\n
      ${err.message}`
    );
  }

  if (pluginOptions.enablesEmptyAttribute) {
    registerEmptyAttributeFieldNamesInPageAttributes(asciidocNode);
  }
}

module.exports = onCreateNode;
