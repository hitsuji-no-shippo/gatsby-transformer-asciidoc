const { loadAsciidoctorOptions } = require(`./asciidoctor`);
const { setPageAttributePrefix } = require(`./page-attributes-field`);

const pluginOptions = {};

const loadOptions = (configOptions, pathPrefix) => {
  const loadOwnOptions = options => {
    const loadPageAttributePrefix = pageAttributePrefix => {
      const prefix =
        pageAttributePrefix === undefined ? `page-` : pageAttributePrefix;

      setPageAttributePrefix(prefix === `` ? `` : new RegExp(`^${prefix}`));

      return prefix;
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

    return {
      pageAttributePrefix: loadPageAttributePrefix(pageAttributePrefix),
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

  const { pageAttributePrefix, ...options } = loadOwnOptions(configOptions);

  Object.assign(pluginOptions, options);

  loadAsciidoctorOptions(deletePluginOptions(configOptions), pathPrefix);

  return pageAttributePrefix;
};

module.exports = {
  loadOptions,
  pluginOptions,
};
