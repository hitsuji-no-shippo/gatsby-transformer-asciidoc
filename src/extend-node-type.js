// const { GraphQLBoolean } = require(`gatsby/graphql`);

const { EMPTY_ATTRIBUTE_FIELD_VALUE } = require(`./asciidoc-attributes`);
const {
  safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache,
} = require(`./page-attributes-field`);

let enablesEmptyAttribute = true;

const setEnablesEmptyAttribute = enables => {
  if (typeof enables === `boolean`) {
    enablesEmptyAttribute = enables;
  }
};

async function setFieldsOnGraphQLNodeType({ type, getNodesByType, cache }) {
  if (type.name !== `Asciidoc` || !enablesEmptyAttribute) {
    return {};
  }

  const emptyAttributeFieldNamesAllNodesPageAttributes = await (async () => {
    const registerEmptyAttributeFieldNames = new Set();
    let names = [];

    getNodesByType(`Asciidoc`).forEach(node => {
      registerEmptyAttributeFieldNames.add(
        new Promise(resolve => {
          safeLoadEmptyAttributeFieldNamesWithinPageAttributesCache(
            node,
            cache
          ).then(emptyAttributeFieldNames => {
            names = [...names, ...emptyAttributeFieldNames];

            resolve();
          });
        })
      );
    });

    return Promise.all(registerEmptyAttributeFieldNames).then(
      () => new Set(names)
    );
  })();
  // I don't know the official name of the author part of graphql below.
  // Therefore, here it is objectTypeName. (refactor #12)
  // author {
  //  fullName
  // }
  const defineEmptyAttributefields = (attributeNames, objectTypeName) => {
    return Array.from(attributeNames).reduce((attributesFields, name) => {
      const fieldName =
        objectTypeName === undefined ? name : `${objectTypeName}.${name}`;

      const fields = attributesFields;

      fields[fieldName] = {
        // type: GraphQLBoolean,
        type: `Boolean`,
        resolve: source => {
          const value = source[name];

          if (typeof value === `boolean`) {
            return value;
          }
          return value === EMPTY_ATTRIBUTE_FIELD_VALUE;
        },
      };

      return fields;
    }, {});
  };

  return defineEmptyAttributefields(
    emptyAttributeFieldNamesAllNodesPageAttributes,
    `pageAttributes`
  );
}

module.exports = {
  setEnablesEmptyAttribute,
  setFieldsOnGraphQLNodeType,
};
