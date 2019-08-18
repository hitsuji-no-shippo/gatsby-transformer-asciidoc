// There is no way to preserve empty  attribute names other than global
// variables. (refactor #13)
const emptyAttributeNamesInPageAttributes = new Set([])
const EMPTY_ATTRIBUTE_VALUE = ''
module.exports = { emptyAttributeNamesInPageAttributes, EMPTY_ATTRIBUTE_VALUE }
