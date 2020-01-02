const _ = require(`lodash`);
const fs = require(`fs`);
const yaml = require(`js-yaml`);
const {
  selfReferencedObject,
} = require(`@hitsuji_no_shippo/self-referenced-object`);

const { setAttributesOfIgnoreAsciidoc } = require(`./asciidoc-attributes`);
const { setAsciidoctorOptions } = require(`./asciidoctor`);
const { setPageAttributePrefix } = require(`./page-attributes-field`);
const { setSupportExtensions } = require(`./on-node-create`);
const { setEnablesEmptyAttribute } = require(`./extend-node-type`);

const { isObject, hasProperty } = require(`./object`);

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
          // asciidoctor.js convert options without attributes
          // https://asciidoctor-docs.netlify.com/asciidoctor.js/processor/convert-options/
          const notTailor = [
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
          ].reduce((optionValues, name) => {
            const value = unifiedOptions[name];
            const values = optionValues;

            // The convert options contain boolean value
            if (value !== null && value !== undefined) {
              values[name] = value;
            }

            return values;
          }, {});

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
            partialsAttributes: attributesCache.tailored.partials,
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
