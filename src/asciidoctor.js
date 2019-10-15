const asciidoctor = require(`asciidoctor`)();

let convertOptions;

const setAsciidoctorOptions = ({
  converterFactory,
  convertOptions: convert,
}) => {
  // Don't know how to determine whether a class
  if (typeof converterFactory === `function`) {
    asciidoctor.ConverterFactory.register(
      new converterFactory(asciidoctor), // eslint-disable-line new-cap
      [`html5`]
    );
  }

  convertOptions = convert;
};
const loadAsciidoc = asciidoc => {
  return asciidoctor.load(asciidoc, convertOptions);
};

module.exports = {
  setAsciidoctorOptions,
  loadAsciidoc,
};
