const { loadAsciidoc } = require(`./asciidoctor`);
const { createAsciidocNode, setAsciidocCaches } = require(`./asciidoc-node`);

let supportExtensions = new Set([`adoc`, `asciidoc`]);

const setSupportExtensions = extensions => {
  if (Object.prototype.toString.call(extensions) === `[object Set]`) {
    supportExtensions = extensions;
  } else if (Array.isArray(extensions)) {
    supportExtensions = new Set(extensions);
  }
};

async function onCreateNode({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  reporter,
  createContentDigest,
  cache,
}) {
  if (!supportExtensions.has(node.extension)) {
    return;
  }
  // Load Asciidoc contents
  const content = await loadNodeContent(node);
  const relativeFullPath = (() => {
    const path = `/${node.name}`;

    return node.relativeDirectory ? `/${node.relativeDirectory}${path}` : path;
  })();
  // We use a `let` here as a warning: some operations,
  // like .convert() mutate the document
  const doc = await loadAsciidoc(content, relativeFullPath);
  let asciidocNode;

  try {
    asciidocNode = createAsciidocNode(
      content,
      doc,
      node.absolutePath,
      relativeFullPath,
      node.id,
      createNodeId,
      createContentDigest
    );

    if (asciidocNode === null) {
      return;
    }

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

  setAsciidocCaches(doc, asciidocNode.pageAttributes, asciidocNode.id, cache);
}

module.exports = {
  setSupportExtensions,
  onCreateNode,
};
