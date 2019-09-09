const asciidoctor = require(`asciidoctor`)();

const { updateCache } = require(`./cache`);

const convertOptions = {};

const loadAsciidoctorOptions = (options, pathPrefix) => {
  // register custom converter if given
  const registerConverterFactory = converterFactory => {
    let customConverter;

    if (converterFactory !== undefined) {
      customConverter = new converterFactory(asciidoctor); // eslint-disable-line new-cap
      asciidoctor.ConverterFactory.register(customConverter, [`html5`]);
    }

    return customConverter;
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

  const customConverter = registerConverterFactory(
    asciidoctorOptions.converterFactory
  );
  delete asciidoctorOptions.converterFactory;

  setConvertOptions(asciidoctorOptions);

  if (customConverter !== undefined) {
    asciidoctorOptions.customConverter = customConverter;
  }
  asciidoctorOptions.pathPrefix = pathPrefix;

  return asciidoctorOptions;
};

const loadAsciidoc = asciidoc => {
  return asciidoctor.load(asciidoc, convertOptions);
};

async function hasUpdatedAsciidocFields(asciidoctorOptions, cache) {
  return updateCache(asciidoctorOptions, `asciidoctor-options`, cache);
}

module.exports = {
  loadAsciidoctorOptions,
  loadAsciidoc,
  hasUpdatedAsciidocFields,
};
