const asciidoctor = require(`asciidoctor`)();
const matter = require(`gray-matter`);
const yaml = require(`js-yaml`);

const {
  emptyAttributeFieldNamesWithinAllNodesPageAttributes,
  EMPTY_ATTRIBUTE_VALUE,
} = require(`./empty-value-with-attribute`);

let pageAttributePrefix;
const convertOptions = {};

const setPageAttributePrefix = prefix => {
  pageAttributePrefix = prefix;
};

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

const extractPageAttributes = (
  attributes,
  enablesEmptyAttribute,
  namePattern
) => {
  const fields = {};
  const extractsAttribute = namePattern instanceof RegExp;

  Object.entries(attributes).forEach(([key, value]) => {
    let attributeName = key;

    if (extractsAttribute) {
      attributeName = attributeName.replace(namePattern, ``);

      if (attributeName === key) {
        return;
      }
    }

    // GraphQL field Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ ,
    // so replace `-` with `_` .
    const fieldName = attributeName.replace(/-/g, `_`);
    const loadPageAttributeValue = () => {
      if (value === EMPTY_ATTRIBUTE_VALUE && enablesEmptyAttribute) {
        emptyAttributeFieldNamesWithinAllNodesPageAttributes.add(fieldName);
        return EMPTY_ATTRIBUTE_VALUE;
      }
      return yaml.safeLoad(value);
    };

    fields[fieldName] = loadPageAttributeValue();
  });

  return fields;
};

const loadPageAttributesField = (attributes, enablesEmptyAttribute) => {
  return extractPageAttributes(
    attributes,
    enablesEmptyAttribute,
    pageAttributePrefix
  );
};

const createAsciidocFields = (doc, definesEmptyAttributes) => {
  const html = doc.convert();
  // Use "partition" option to be able to get title, subtitle, combined
  const title = doc.getDocumentTitle({ partition: true });
  const description = doc.getAttribute(`description`);

  let revision = null;
  let author = null;

  if (doc.hasRevisionInfo()) {
    revision = {
      date: doc.getRevisionDate(),
      number: doc.getRevisionNumber(),
      remark: doc.getRevisionRemark(),
    };
  }

  if (doc.getAuthor()) {
    author = {
      fullName: doc.getAttribute(`author`),
      firstName: doc.getAttribute(`firstname`),
      lastName: doc.getAttribute(`lastname`),
      middleName: doc.getAttribute(`middlename`),
      authorInitials: doc.getAttribute(`authorinitials`),
      email: doc.getAttribute(`email`),
    };
  }

  const pageAttributes = loadPageAttributesField(
    doc.getAttributes(),
    definesEmptyAttributes
  );

  return {
    html,
    document: {
      title: title.getCombined(),
      subtitle: title.getSubtitle(),
      main: title.getMain(),
      description,
    },
    revision,
    author,
    pageAttributes,
  };
};

const createNode = (
  asciidoc,
  doc,
  { definesEmptyAttributes },
  sourceNodeId,
  createNodeId,
  createContentDigest
) => {
  const frontmatter = matter(asciidoc);
  const node = createAsciidocFields(doc, definesEmptyAttributes);

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
  setPageAttributePrefix,
  loadAsciidoctorOptions,
  loadAsciidoc,
  createAsciidocNode: createNode,
};
