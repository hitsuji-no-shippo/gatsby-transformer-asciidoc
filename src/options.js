const _ = require(`lodash`);
const fs = require(`fs`);
const yaml = require(`js-yaml`);
const {
  selfReferencedObject,
} = require(`@hitsuji_no_shippo/self-referenced-object`);

const {
  setAttributesOfIgnoreAsciidoc,
  setReplacedAttributesToFieldValue,
} = require(`./asciidoc-attributes`);
const { setAsciidoctorOptions } = require(`./asciidoctor`);
const { setPageAttributePrefix } = require(`./page-attributes-field`);
const { setSupportExtensions } = require(`./on-node-create`);
const { setEnablesEmptyAttribute } = require(`./extend-node-type`);

const { isObject, hasProperty, getProperty } = require(`./object`);

const setOptions = async (configOptions, pathPrefix, cache) => {
  const {
    asciidoctor: asciidoctorOptions,
    isOptionsCacheEqual,
  } = await (async () => {
    const setDefaultProperties = (object, properties) => {
      Object.entries(properties).forEach(([key, value]) => {
        if (hasProperty(object, key)) {
          if (isObject(value)) {
            setDefaultProperties(object[key], value);
          }
        } else {
          const obj = object;

          obj[key] = value;
        }
      });

      return object;
    };
    /**
     * Unify options.
     * The target gatsby-config.js (configOptions) and option file.
     * @returns {Object} Unified options
     */
    const unifiedOptions = (() => {
      /**
       * Read option file.
       * The file to be read is decided by optionFile of gatsby-config.js.
       * @returns {Object} options in option file
       */
      const optionFile = (() => {
        const { path, encoding } = setDefaultProperties(
          configOptions.optionFile || {},
          {
            path: `./asciidoctor-option.yaml`,
            encoding: `utf8`,
          }
        );

        return (() => {
          let file;

          try {
            file = yaml.safeLoad(fs.readFileSync(path, encoding));
          } catch (err) {
            if (err.code !== `ENOENT`) {
              throw err;
            }
          }

          return file;
        })();
      })();

      if (optionFile) {
        const overwriteProperties = (priority, subordinate) => {
          Object.entries(subordinate).forEach(([key, value]) => {
            if (hasProperty(priority, key)) {
              if (isObject(value)) {
                overwriteProperties(priority[key], subordinate[key]);
              }
            } else {
              const substitute = priority;

              substitute[key] = value;
            }
          });
        };

        overwriteProperties(configOptions, optionFile);
      }

      return configOptions;
    })();

    return (async () => {
      setAttributesOfIgnoreAsciidoc(unifiedOptions.ignore);

      const isValueCacheEqual = (value, optionsCache, name) => {
        return _.isEqual(value, optionsCache[name]);
      };
      const updateCache = (value, optionsCache, name) => {
        const isCacheEqual = isValueCacheEqual(value, optionsCache, name);

        if (!isCacheEqual) {
          const options = optionsCache;

          options[name] = value;
        }

        return isCacheEqual;
      };
      // prettier-ignore
      const optionsCache =
        (await cache.get('options')) ||
        {
          asciidoctorConvert: {
            tailor: {
              attributes: {
                input: {},
                tailored: {},
              },
            },
            notTailor: {},
          },
        };
      /**
       * Set node options.
       * @return {boolean} Whether the page attribute prefix of
       *                   unified options and optionsCache are equal
       */
      const isPageAttributePrefixCacheEqual = (() => {
        setSupportExtensions(unifiedOptions.fileExtensions);
        setEnablesEmptyAttribute(unifiedOptions.enablesEmptyAttribute);

        const { pageAttributePrefix } = unifiedOptions;

        setPageAttributePrefix(pageAttributePrefix);

        return updateCache(
          pageAttributePrefix,
          optionsCache,
          `pageAttributePrefix`
        );
      })();
      /**
       * Tailor asciidoctor options.
       * Classify convert options and others and change attributes options.
       * @returns {Object} asciidoctor options and
       *                   the result of whether the convert options of
       *                   unified options and optionsCache are equal
       */
      const {
        asciidoctor,
        isConvertOptionsCacheEqual: isAsciidoctorConvertCacheEqual,
      } = (() => {
        let isConvertOptionsCacheEqual = true;
        const asciidoctorConvertCache = optionsCache.asciidoctorConvert;
        const convertOptions = (() => {
          const notTailor = (() => {
            const extractValues = (optionsNames, obj) => {
              return optionsNames.reduce((values, name) => {
                const value = obj[name];

                if (value !== null && value !== undefined) {
                  Object.assign(values, {
                    [name]: value,
                  });
                }

                return values;
              }, {});
            };

            const attributes = {
              options: (() => {
                const options = getProperty(
                  unifiedOptions,
                  'attributes.options'
                );

                if (!isObject(options)) {
                  return {};
                }

                const extracedOptions = {
                  replace: setReplacedAttributesToFieldValue,
                  paths: null,
                };

                const values = extractValues(
                  Object.keys(extracedOptions),
                  options
                );

                Object.entries(extracedOptions).forEach(
                  ([name, setFunction]) => {
                    if (hasProperty(values, name)) {
                      if (setFunction !== null) {
                        setFunction(values[name]);
                      }
                    }
                  }
                );

                return values;
              })(),
            };

            const valuesExceptAttributes = extractValues(
              [
                // asciidoctor.js convert options
                // https://asciidoctor-docs.netlify.com/asciidoctor.js/processor/convert-options/
                `backend`,
                `base_dir`,
                `catalog_assets`,
                `doctype`,
                `extensions_registry`,
                `header_footer`,
                `mkdirs`,
                `parse`,
                `safe`,
                `sourcemap`,
                `template_dirs`,
                `to_dir`,
                `to_file`,
              ],
              unifiedOptions
            );

            return { ...{ attributes }, ...valuesExceptAttributes };
          })();

          if (!updateCache(notTailor, asciidoctorConvertCache, `notTailor`)) {
            isConvertOptionsCacheEqual = false;
          }

          const tailor = (() => {
            const { attributes } = unifiedOptions;

            return {
              attributes: isObject(attributes) ? attributes : {},
            };
          })();

          return { ...notTailor, ...tailor };
        })();
        const attributesCache = asciidoctorConvertCache.tailor.attributes;

        /**
         * Tailor attributes.
         * If equal to cache, assign the cache value to attributes
         * to skip processing.
         */
        (() => {
          const { attributes } = convertOptions;

          if (
            // If does not use `cloneDeep`, `attributes` changes will be
            // reflected to `attributesCache.input`.
            updateCache(_.cloneDeep(attributes), attributesCache, `input`) &&
            updateCache(pathPrefix, optionsCache, `pathPrefix`)
          ) {
            return;
          }

          isConvertOptionsCacheEqual = false;

          setDefaultProperties(attributes, {
            values: { 'imagesdir@': `/images` },
            options: {
              selfReferencedObject: { runs: true, shouldConvert: true },
              partials: {
                attributes: {},
                references: {
                  shouldReferSelf: true,
                  shouldConvert: true,
                  shouldReferToAttributesToAddToAll: true,
                },
              },
            },
          });

          attributes.values[`skip-front-matter`] = true;
          attributes.values[`imagesdir@`] = (
            pathPrefix + attributes.values[`imagesdir@`]
          ).replace(/\/\//, `/`);

          {
            const { options } = attributes;
            const attributesValues = {};

            if (options.selfReferencedObject.runs) {
              selfReferencedObject(
                attributes.values,
                options.selfReferencedObject.shouldConvert,
                { allKeyValues: attributesValues }
              );
            }

            attributesCache.tailored.addToAll = attributes.values;

            attributesCache.tailored.partials = (() => {
              if (
                !isObject(options.partials.attributes) &&
                Object.keys(options.partials.attributes).length < 1
              ) {
                return null;
              }

              if (options.partials.references.shouldReferSelf) {
                selfReferencedObject(
                  options.partials.attributes,
                  options.partials.references.shouldConvert,
                  options.partials.references.shouldReferToAttributesToAddToAll
                    ? { anotherObjectKeyValues: attributesValues }
                    : {}
                );
              }

              return options.partials.attributes;
            })();
          }
        })();

        const { tailored } = attributesCache;

        convertOptions.attributes = tailored.addToAll;

        return {
          asciidoctor: {
            converterFactory: unifiedOptions.converterFactory,
            convertOptions,
            attributes: {
              partials: tailored.partials,
              paths: asciidoctorConvertCache.notTailor.attributes.options.paths,
            },
          },
          isConvertOptionsCacheEqual,
        };
      })();

      if (
        !(isPageAttributePrefixCacheEqual && isAsciidoctorConvertCacheEqual)
      ) {
        cache.set('options', optionsCache);
      }

      return {
        asciidoctor,
        isOptionsCacheEqual: {
          pageAttributePrefix: isPageAttributePrefixCacheEqual,
          asciidoctorConvert: isAsciidoctorConvertCacheEqual,
        },
      };
    })();
  })();

  setAsciidoctorOptions(asciidoctorOptions);

  return isOptionsCacheEqual;
};

module.exports = {
  setOptions,
};
