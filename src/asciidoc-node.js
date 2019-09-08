const { createHeaderAndMetadataAttributes } = require(`./asciidoc-attributes`);
const { loadPageAttributesField } = require(`./page-attributes-field`);

const createInternalField = (asciidoc, contentDigest) => {
  return {
    type: `Asciidoc`,
    mediaType: `text/html`,
    content: asciidoc,
    contentDigest,
  };
};

const createAsciidocFields = doc => {
  const attributesFields = {
    ...createHeaderAndMetadataAttributes(doc),
    ...{ pageAttributes: loadPageAttributesField(doc.getAttributes()) },
  };

  return { ...{ html: doc.convert() }, ...attributesFields };
};

const createNode = (
  asciidoc,
  doc,
  sourceNodeId,
  createNodeId,
  createContentDigest
) => {
  const node = createAsciidocFields(doc);

  node.id = createNodeId(`${sourceNodeId} >>> ASCIIDOC`);
  node.parent = sourceNodeId;
  node.children = [];
  node.internal = createInternalField(asciidoc, createContentDigest(node));

  return node;
};

module.exports = {
  createAsciidocNode: createNode,
};
