const { loadAsciidoctorOptions } = require(`./asciidoctor`);
const { setPageAttributePrefix } = require(`./page-attributes-field`);

const pluginOptions = {};

const loadOptions = (configOptions, pathPrefix) => {
  const loadOwnOptions = options => {
    const loadPageAttributePrefix = pageAttributePrefix => {
      const prefix =
        pageAttributePrefix === undefined ? `page-` : pageAttributePrefix;

      setPageAttributePrefix(prefix === `` ? `` : new RegExp(`^${prefix}`));
    };
    const loadExtensions = extensions => {
      // make extensions configurable and use adoc and asciidoc as default
      return typeof extensions !== `undefined` && extensions instanceof Array
        ? extensions
        : [`adoc`, `asciidoc`];
    };
    const loadDefinesEmptyAttributes = enablesEmptyAttribute => {
      if (enablesEmptyAttribute === undefined) {
        return true;
      }
      return enablesEmptyAttribute;
    };

    const { pageAttributePrefix, extensions, enablesEmptyAttribute } = options;

    loadPageAttributePrefix(pageAttributePrefix);

    return {
      supportedExtensions: loadExtensions(extensions),
      enablesEmptyAttribute: loadDefinesEmptyAttributes(enablesEmptyAttribute),
    };
  };
  const deletePluginOptions = options => {
    const asciidoctorOptions = options;

    delete asciidoctorOptions.extensions;
    delete asciidoctorOptions.pageAttributePrefix;
    delete asciidoctorOptions.enablesEmptyAttribute;
    delete asciidoctorOptions.plugins;

    return asciidoctorOptions;
  };

  Object.assign(pluginOptions, loadOwnOptions(configOptions));

  loadAsciidoctorOptions(deletePluginOptions(configOptions), pathPrefix);
};

module.exports = { loadOptions, pluginOptions };
