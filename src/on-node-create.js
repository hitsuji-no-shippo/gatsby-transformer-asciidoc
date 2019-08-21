const { loadAsciidoc, createAsciidocNode } = require(`./asciidoctor`);
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

  try {
    const asciidocNode = createAsciidocNode(
      content,
      doc,
      pluginOptions,
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
}

module.exports = onCreateNode;
