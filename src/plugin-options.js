const { loadAsciidoctorOptions } = require(`./asciidoctor`);

const pluginOptions = {};

const loadOptions = (configOptions, pathPrefix) => {
  const loadOwnOptions = options => {
    const loadExtensions = extensions => {
      // make extensions configurable and use adoc and asciidoc as default
      return typeof extensions !== `undefined` && extensions instanceof Array
        ? extensions
        : [`adoc`, `asciidoc`];
    };
    const loadDefinesEmptyAttributes = definesEmptyAttributes => {
      if (definesEmptyAttributes === undefined) {
        return true;
      }
      return definesEmptyAttributes;
    };

    const { extensions, definesEmptyAttributes } = options;

    return {
      supportedExtensions: loadExtensions(extensions),
      definesEmptyAttributes: loadDefinesEmptyAttributes(
        definesEmptyAttributes
      ),
    };
  };
  const deletePluginOptions = options => {
    const asciidoctorOptions = options;

    delete asciidoctorOptions.extensions;
    delete asciidoctorOptions.definesEmptyAttributes;
    delete asciidoctorOptions.plugins;

    return asciidoctorOptions;
  };

  Object.assign(pluginOptions, loadOwnOptions(configOptions));

  loadAsciidoctorOptions(deletePluginOptions(configOptions), pathPrefix);
};

module.exports = { loadOptions, pluginOptions };