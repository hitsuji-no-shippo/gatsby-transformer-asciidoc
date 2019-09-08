const asciidoctor = require(`asciidoctor`)();

const convertOptions = {};

const loadAsciidoctorOptions = (options, pathPrefix) => {
  // register custom converter if given
  const registerConverterFactory = converterFactory => {
    if (converterFactory !== undefined) {
      asciidoctor.ConverterFactory.register(
        new converterFactory(asciidoctor), // eslint-disable-line new-cap
        [`html5`]
      );
    }
  };
  const setConvertOptions = asciidoctorOptions => {
    const loadAttributes = attributes => {
      const addAutoValues = () => {
        const defaultImagesDir = `/images`;
        const currentPathPrefix = pathPrefix || ``;
        const withPathPrefix = (prefix, url) =>
          (prefix + url).replace(/\/\//, `/`);
        const target = attributes || {};

        target[`imagesdir@`] = withPathPrefix(
          currentPathPrefix,
          target[`imagesdir@`] || defaultImagesDir
        );
        target[`skip-front-matter`] = true;

        return target;
      };

      return addAutoValues();
    };
    Object.assign(convertOptions, asciidoctorOptions);

    convertOptions.attributes = loadAttributes(convertOptions.attributes);
  };
  const asciidoctorOptions = options;

  registerConverterFactory(asciidoctorOptions.converterFactory);
  delete asciidoctorOptions.converterFactory;

  setConvertOptions(asciidoctorOptions);
};

const loadAsciidoc = asciidoc => {
  return asciidoctor.load(asciidoc, convertOptions);
};

module.exports = {
  loadAsciidoctorOptions,
  loadAsciidoc,
};
