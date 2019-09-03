const asciidoctor = require(`asciidoctor`)();

const { createHeaderAndMetadataAttributes } = require(`./asciidoc-attributes`);
const { loadPageAttributesField } = require(`./page-attributes-field`);

const convertOptions = {};

const loadAsciidoctorOptions = (options, pathPrefix) => {
  // register custom converter if given
  const registerConverterFactory = converterFactory => {
    if (converterFactory !== undefined) {
      asciidoctor.ConverterFactory.register(
        new converterFactory(asciidoctor), // eslint-disable-line new-cap
        [`html5`]
      );
    }
  };
  const setConvertOptions = asciidoctorOptions => {
    const loadAttributes = attributes => {
      const addAutoValues = () => {
        const defaultImagesDir = `/images`;
        const currentPathPrefix = pathPrefix || ``;
        const withPathPrefix = (prefix, url) =>
          (prefix + url).replace(/\/\//, `/`);
        const target = attributes || {};

        target[`imagesdir@`] = withPathPrefix(
          currentPathPrefix,
          target[`imagesdir@`] || defaultImagesDir
        );
        target[`skip-front-matter`] = true;

        return target;
      };

      return addAutoValues();
    };
    Object.assign(convertOptions, asciidoctorOptions);

    convertOptions.attributes = loadAttributes(convertOptions.attributes);
  };
  const asciidoctorOptions = options;

  registerConverterFactory(asciidoctorOptions.converterFactory);
  delete asciidoctorOptions.converterFactory;

  setConvertOptions(asciidoctorOptions);
};

const loadAsciidoc = asciidoc => {
  return asciidoctor.load(asciidoc, convertOptions);
};

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
  loadAsciidoctorOptions,
  loadAsciidoc,
  createAsciidocNode: createNode,
};
