const yaml = require(`js-yaml`);

const { loadAsciidoc } = require(`./asciidoctor`);
const { safeLoadCache } = require(`./cache`);

const EMPTY_ATTRIBUTE_FIELD_VALUE = null;

// The attribute to create is only in "Header and metadata" of the
// following url link destination table.
// https://asciidoctor.org/docs/user-manual/#builtin-attributes-table
const createHeaderAndMetadataAttributes = doc => {
  const document = (() => {
    const title = (() => {
      // Use "partition" option to be able to get title, subtitle, combined
      const docTitle = doc.getDocumentTitle({ partition: true });
      return {
        title: docTitle.getCombined(),
        main: docTitle.getMain(),
        subtitle: docTitle.getSubtitle(),
      };
    })();

    return {
      ...title,
      ...{ description: doc.getAttribute(`description`) },
    };
  })();
  const author = (() => {
    return doc.getAuthor()
      ? {
          fullName: doc.getAttribute(`author`),
          firstName: doc.getAttribute(`firstname`),
          lastName: doc.getAttribute(`lastname`),
          middleName: doc.getAttribute(`middlename`),
          authorInitials: doc.getAttribute(`authorinitials`),
          email: doc.getAttribute(`email`),
        }
      : null;
  })();
  const revision = (() => {
    return doc.hasRevisionInfo()
      ? {
          date: doc.getRevisionDate(),
          number: doc.getRevisionNumber(),
          remark: doc.getRevisionRemark(),
        }
      : null;
  })();
  const frontmatter = (() => {
    const frontmatterAttribute = doc.getAttribute(`front-matter`);

    return frontmatterAttribute ? yaml.safeLoad(frontmatterAttribute) : null;
  })();

  return {
    document,
    author,
    revision,
    frontmatter,
  };
};

const extractAttributes = (attributes, namePattern) => {
  const convertNameFromAttributeToFiled = attribute => {
    // GraphQL field Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ ,
    // so replace `-` with `_` .
    return attribute.replace(/-/g, `_`);
  };
  const extractsAttribute = namePattern instanceof RegExp;
  const emptyAttributeValue = '';

  return Object.entries(attributes).reduce((attributeFields, [key, value]) => {
    let attributeName = key;

    if (extractsAttribute) {
      attributeName = attributeName.replace(namePattern, ``);

      if (attributeName === key) {
        return attributeFields;
      }
    }

    const fields = attributeFields;

    // If the value uses {} or [], the following error will occur,
    // so enclose the safeLoad() argument in quotation.
    // YAMLException: end of the stream or a document separator is expected ...
    fields[convertNameFromAttributeToFiled(attributeName)] =
      value === emptyAttributeValue
        ? EMPTY_ATTRIBUTE_FIELD_VALUE
        : yaml.safeLoad(`'${value}'`);

    return fields;
  }, {});
};

const loadEmptyAttributeFieldNames = attributeFields => {
  return Object.entries(attributeFields).reduce((names, [name, value]) => {
    if (value === EMPTY_ATTRIBUTE_FIELD_VALUE) {
      names.push(name);
    }

    return names;
  }, []);
};

const getAllAttributesCacheKey = nodeId =>
  `asciidoc-node-all-attributes-${nodeId}`;

const setAllAttributesCache = (doc, nodeId, cache) => {
  cache.set(getAllAttributesCacheKey(nodeId), doc.getAttributes());
};

const safeLoadAllAttributesCache = (node, cache) => {
  return safeLoadCache(getAllAttributesCacheKey(node.id), cache, async () => {
    const doc = await loadAsciidoc(node.internal.content);

    return doc.getAttributes();
  });
};

module.exports = {
  EMPTY_ATTRIBUTE_FIELD_VALUE,
  createHeaderAndMetadataAttributes,
  extractAttributes,
  loadEmptyAttributeFieldNames,
  setAllAttributesCache,
  safeLoadAllAttributesCache,
};
