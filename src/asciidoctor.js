const _ = require(`lodash`);
const asciidoctor = require(`asciidoctor`)();
const extractMatchingValuesInPatterns = require(`@hitsuji_no_shippo/extract-matching-values-in-patterns`);

const { isObject, getProperty } = require(`./object`);

let convertOptions;
let pathAttributs;
const attributes = {
  shouldAddPartials: false,
};

const setAsciidoctorOptions = ({
  converterFactory,
  convertOptions: convert,
  attributes: { partials, paths },
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

  if (isObject(paths)) {
    pathAttributs = paths;
  }
};
const loadAsciidoc = (asciidoc, paths) => {
  if (attributes.shouldAddPartials) {
    convertOptions.attributes = {
      ...attributes.addToAll,
      ...extractMatchingValuesInPatterns(
        paths.from.source.file,
        attributes.partials
      ),
    };
  }

  if (pathAttributs) {
    Object.entries(pathAttributs).forEach(([name, fieldPath]) => {
      const path = getProperty(paths, fieldPath);

      if (!path) {
        return;
      }

      convertOptions.attributes[name] = path;
    });
  }

  return asciidoctor.load(asciidoc, convertOptions);
};
const reloadAsciidoc = node => {
  return loadAsciidoc(node.internal.content, node.paths);
};

module.exports = {
  setAsciidoctorOptions,
  loadAsciidoc,
  reloadAsciidoc,
};
