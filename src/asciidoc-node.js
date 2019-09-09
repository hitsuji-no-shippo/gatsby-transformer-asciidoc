const { loadAsciidoc } = require(`./asciidoctor`);
const {
  createHeaderAndMetadataAttributes,
  loadEmptyAttributeFieldNames,
  setAllAttributesCache,
} = require(`./asciidoc-attributes`);
const {
  loadPageAttributesField,
  setEmptyAttributeFieldNamesWithinPageAttributesCache,
} = require(`./page-attributes-field`);

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

const setAsciidocCaches = (doc, pageAttributes, id, cache) => {
  setEmptyAttributeFieldNamesWithinPageAttributesCache(
    loadEmptyAttributeFieldNames(pageAttributes),
    id,
    cache
  );
  setAllAttributesCache(doc, id, cache);
};

async function updateAsciidocFields(node, cache) {
  const doc = await loadAsciidoc(node.internal.content);
  const asciidocFields = createAsciidocFields(doc);

  Object.assign(node, asciidocFields);

  setAsciidocCaches(doc, asciidocFields.pageAttributes, node.id, cache);
}

module.exports = {
  createAsciidocNode: createNode,
  updateAsciidocFields,
  setAsciidocCaches,
};
