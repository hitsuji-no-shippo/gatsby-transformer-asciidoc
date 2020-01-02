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
  const pathsFrom = {
    project: (() => {
      const full = (() => {
        const delimiter = `"`;
        const { description } = node.internal;

        return description.slice(
          description.indexOf(delimiter) + 1,
          description.lastIndexOf(delimiter)
        );
      })();

      return { full, dir: full.slice(0, full.lastIndexOf(`/`)) };
    })(),
    source: {
      file: (() => {
        const path = `${node.name}`;

        return node.relativeDirectory
          ? `${node.relativeDirectory}/${path}`
          : path;
      })(),
    },
  };
  // We use a `let` here as a warning: some operations,
  // like .convert() mutate the document
  const doc = await loadAsciidoc(content, pathsFrom);
  let asciidocNode;

  try {
    asciidocNode = createAsciidocNode(
      node,
      content,
      doc,
      pathsFrom,
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
