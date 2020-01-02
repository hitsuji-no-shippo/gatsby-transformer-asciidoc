const { replaceToFieldValue } = require(`./asciidoc-attributes`);

const createPages = ({ getNodesByType }) => {
  replaceToFieldValue(getNodesByType);
};

module.exports = createPages;
