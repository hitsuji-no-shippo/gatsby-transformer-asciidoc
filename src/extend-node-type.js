const { GraphQLBoolean } = require(`gatsby/graphql`);

const {
  emptyAttributeFieldNamesWithinAllNodesPageAttributes,
  EMPTY_ATTRIBUTE_VALUE,
} = require(`./empty-value-with-attribute`);

async function setFieldsOnGraphQLNodeType({ type }) {
  if (type.name !== `Asciidoc`) {
    return {};
  }

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
        type: GraphQLBoolean,
        resolve: source => {
          const value = source[name];

          if (typeof value === `boolean`) {
            return value;
          }

          return value === EMPTY_ATTRIBUTE_VALUE;
        },
      };

      return fields;
    }, {});
  };

  return defineEmptyAttributefields(
    emptyAttributeFieldNamesWithinAllNodesPageAttributes,
    `pageAttributes`
  );
}

module.exports = setFieldsOnGraphQLNodeType;
