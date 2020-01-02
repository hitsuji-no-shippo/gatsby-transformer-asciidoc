const sanitizeHTML = require(`sanitize-html`);
const _ = require(`lodash`);

const { reloadAsciidoc } = require(`./asciidoctor`);
const {
  hasAttributesOfIgnoreAsciidoc,
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

const createPathsField = (absoluteFile, pathsFrom) => {
  return {
    absolute: {
      file: absoluteFile,
    },
    from: pathsFrom,
  };
};

const createAsciidocFields = doc => {
  const html = doc.convert();
  const allAttributes = doc.getAttributes();

  if (hasAttributesOfIgnoreAsciidoc(allAttributes)) {
    return null;
  }

  /*
   * Calculate time to read
   * @returns {number} time to read
   */
  const timeToRead = (() => {
    const pureText = sanitizeHTML(html, { allowTags: [] });
    const wordCount =
      _.words(pureText).length +
      _.words(pureText, /[\p{sc=Katakana}\p{sc=Hiragana}\p{sc=Han}]/gu).length;
    const avgWPM = 265;
    const time = Math.round(wordCount / avgWPM);

    if (time === 0) {
      return 1;
    }

    return time;
  })();
  const attributesFields = {
    ...createHeaderAndMetadataAttributes(doc),
    ...{ pageAttributes: loadPageAttributesField(allAttributes) },
  };

  return { ...{ html, timeToRead }, ...attributesFields };
};

const createNode = (
  sourceNode,
  asciidoc,
  doc,
  pathsFrom,
  createNodeId,
  createContentDigest
) => {
  const node = createAsciidocFields(doc);

  if (node === null) {
    return null;
  }

  Object.assign(node, {
    paths: createPathsField(sourceNode.absolutePath, pathsFrom),
    id: createNodeId(`${sourceNode.id} >>> ASCIIDOC`),
    parent: sourceNode.id,
    children: [],
  });

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
  const doc = await reloadAsciidoc(node);
  const asciidocFields = createAsciidocFields(doc);

  Object.assign(node, asciidocFields);

  setAsciidocCaches(doc, asciidocFields.pageAttributes, node.id, cache);
}

module.exports = {
  createAsciidocNode: createNode,
  updateAsciidocFields,
  setAsciidocCaches,
};
