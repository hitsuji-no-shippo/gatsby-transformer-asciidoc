const fs = require(`fs`);
const yaml = require(`js-yaml`);

const { loadAsciidoctorOptions } = require(`./asciidoctor`);
const { setPageAttributePrefix } = require(`./page-attributes-field`);

const pluginOptions = {};

const loadOptions = (configOptions, pathPrefix) => {
  const loadOptionFile = options => {
    const loadOptionFileInfo = () => {
      const defaultPath = `./asciidoctor-option.yaml`;
      const defaultEncoding = `utf8`;
      const target = options.optionFile || {};

      return {
        path: target.path || defaultPath,
        encoding: target.encoding || defaultEncoding,
      };
    };
    const readOptionFile = (path, encoding) => {
      let optionFile;

      try {
        optionFile = yaml.safeLoad(fs.readFileSync(path, encoding));
      } catch (err) {
        if (err.code !== `ENOENT`) {
          throw err;
        }
      }

      return optionFile;
    };
    const { path, encoding } = loadOptionFileInfo(options);

    return readOptionFile(path, encoding);
  };
  const overwriteOptions = (priority, subordinate) => {
    let overwritignOptions = priority;
    overwritignOptions.attributes = {
      ...subordinate.attributes,
      ...priority.attributes,
    };
    overwritignOptions = { ...subordinate, ...overwritignOptions };

    return overwritignOptions;
  };
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
    delete asciidoctorOptions.optionFile;

    return asciidoctorOptions;
  };
  let options;
  const optionFile = loadOptionFile(configOptions);

  if (optionFile) {
    options = overwriteOptions(configOptions, optionFile);
  } else {
    options = configOptions;
  }

  const { pageAttributePrefix, ...ownOptions } = loadOwnOptions(options);

  Object.assign(pluginOptions, ownOptions);

  const asciidoctorOptions = loadAsciidoctorOptions(
    deletePluginOptions(configOptions),
    pathPrefix
  );

  return { pageAttributePrefix, asciidoctorOptions };
};

module.exports = {
  loadOptions,
  pluginOptions,
};
