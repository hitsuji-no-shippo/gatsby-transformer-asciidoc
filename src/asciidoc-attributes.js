const yaml = require(`js-yaml`);

const { reloadAsciidoc } = require(`./asciidoctor`);
const { safeLoadCache } = require(`./cache`);

const { isObject, getProperty } = require(`./object`);

const EMPTY_ATTRIBUTE_FIELD_VALUE = null;

let attributesOfIgnoreAsciidoc;

const setAttributesOfIgnoreAsciidoc = attributes => {
  if (isObject(attributes)) {
    attributesOfIgnoreAsciidoc = attributes;
  }
};

const hasAttributesOfIgnoreAsciidoc = attributes => {
  return attributesOfIgnoreAsciidoc
    ? Object.entries(attributesOfIgnoreAsciidoc).some(([name, values]) => {
        return values.includes(attributes[name]);
      })
    : false;
};

let replacedAttributesToFieldValue;

const setReplacedAttributesToFieldValue = obj => {
  if (isObject(obj)) {
    replacedAttributesToFieldValue = obj;
  }
};

const replaceToFieldValue = async getNodesByType => {
  if (!replacedAttributesToFieldValue) {
    return;
  }

  await Promise.all(
    getNodesByType(`Asciidoc`).reduce((replaces, node) => {
      replaces.push(
        new Promise(resolve => {
          Object.entries(replacedAttributesToFieldValue).forEach(
            ([name, fieldPath]) => {
              const value = getProperty(node, fieldPath);

              if (!value) {
                return;
              }

              Object.assign(node, {
                html: node.html.replace(`{${name}}`, value),
              });
            }
          );
          resolve();
        })
      );

      return replaces;
    }, [])
  );
};

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

  return Object.entries(attributes).reduce((fields, [key, value]) => {
    let attributeName = key;

    if (extractsAttribute) {
      attributeName = attributeName.replace(namePattern, ``);

      if (attributeName === key) {
        return fields;
      }
    }

    const field = (() => {
      const fieldValue = (() => {
        if (value === emptyAttributeValue) {
          return EMPTY_ATTRIBUTE_FIELD_VALUE;
        }

        return yaml.safeLoad(
          typeof value === `object` ? JSON.stringify(value) : value
        );
      })();

      return {
        [convertNameFromAttributeToFiled(attributeName)]: fieldValue,
      };
    })();

    Object.assign(fields, field);

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
    const doc = await reloadAsciidoc(node);

    return doc.getAttributes();
  });
};

module.exports = {
  EMPTY_ATTRIBUTE_FIELD_VALUE,
  setAttributesOfIgnoreAsciidoc,
  hasAttributesOfIgnoreAsciidoc,
  setReplacedAttributesToFieldValue,
  replaceToFieldValue,
  createHeaderAndMetadataAttributes,
  extractAttributes,
  loadEmptyAttributeFieldNames,
  setAllAttributesCache,
  safeLoadAllAttributesCache,
};
