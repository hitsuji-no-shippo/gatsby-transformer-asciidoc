const { GraphQLBoolean } = require(`gatsby/graphql`)

const {
  emptyAttributeNamesInPageAttributes, EMPTY_ATTRIBUTE_VALUE
} = require(`./empty-value-with-attribute`)


async function setFieldsOnGraphQLNodeType({ type }) {
  if (type.name !== `Asciidoc`) {
    return {}
  }

  // I don't know the official name of the author part of graphql below.
  // Therefore, here it is objectTypeName. (refactor #12)
  // author {
  //  fullName
  // }
  const defineEmptyAttributefields = (attributeNames, objectTypeName) => {
    const fields = {}

    attributeNames.forEach(name => {
      // GraphQL filed Names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ ,
      // so replace `-` with `_` .
      const fieldName = (
        objectTypeName === undefined ? name : objectTypeName + `.` + name
      ).replace(`-`, `_`)

      fields[fieldName] = {
        type: GraphQLBoolean,
        resolve: (source) => {
          const value = source[name]

          if (typeof value === `boolean`) {
            return value
          }

          return value === EMPTY_ATTRIBUTE_VALUE
        }
      }
    })

    return fields
  }

  return defineEmptyAttributefields(
    emptyAttributeNamesInPageAttributes, `pageAttributes`
  )
}

module.exports = setFieldsOnGraphQLNodeType
