const asciidoctor = require(`asciidoctor`)();
const matter = require(`gray-matter`);

const {
  loadDocument,
  loadAuthor,
  loadRevision,
} = require(`./asciidoc-attributes`);
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
        const defaultSkipFrontMatter = true;
        const withPathPrefix = (prefix, url) =>
          (prefix + url).replace(/\/\//, `/`);
        const target = attributes || {};

        target[`imagesdir@`] = withPathPrefix(
          currentPathPrefix,
          target[`imagesdir@`] || defaultImagesDir
        );
        if (!Object.hasOwnProperty.call(target, `skip-front-matter`)) {
          target[`skip-front-matter`] = defaultSkipFrontMatter;
        }

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

const createInternalField = (content, contentDigest) => {
  return {
    type: `Asciidoc`,
    mediaType: `text/html`,
    content,
    contentDigest,
  };
};

const createAsciidocFields = doc => {
  const attributesFields = {
    document: loadDocument(doc),
    author: loadAuthor(doc),
    revision: loadRevision(doc),
    pageAttributes: loadPageAttributesField(doc.getAttributes()),
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
  const frontmatter = matter(asciidoc);
  const node = createAsciidocFields(doc);

  node.frontmatter = frontmatter.data;
  node.id = createNodeId(`${sourceNodeId} >>> ASCIIDOC`);
  node.parent = sourceNodeId;
  node.children = [];
  node.internal = createInternalField(
    frontmatter.content,
    createContentDigest(node)
  );

  return node;
};

module.exports = {
  loadAsciidoctorOptions,
  loadAsciidoc,
  createAsciidocNode: createNode,
};
