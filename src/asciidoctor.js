const _ = require(`lodash`);
const asciidoctor = require(`asciidoctor`)();
const extractMatchingValuesInPatterns = require(`@hitsuji_no_shippo/extract-matching-values-in-patterns`);

let convertOptions;
const attributes = {
  shouldAddPartials: false,
};

const setAsciidoctorOptions = ({
  converterFactory,
  convertOptions: convert,
  partialsAttributes: partials,
}) => {
  // Don't know how to determine whether a class
  if (typeof converterFactory === `function`) {
    asciidoctor.ConverterFactory.register(
      new converterFactory(asciidoctor), // eslint-disable-line new-cap
      [`html5`]
    );
  }

  convertOptions = convert;

  if (partials) {
    attributes.shouldAddPartials = true;
    attributes.partials = partials;
    attributes.addToAll = _.cloneDeep(convertOptions.attributes);
  }
};
const loadAsciidoc = (asciidoc, pathsFrom) => {
  if (attributes.shouldAddPartials) {
    convertOptions.attributes = {
      ...attributes.addToAll,
      ...extractMatchingValuesInPatterns(
        pathsFrom.source.file,
        attributes.partials
      ),
    };
  }

  return asciidoctor.load(asciidoc, convertOptions);
};

module.exports = {
  setAsciidoctorOptions,
  loadAsciidoc,
};
