const _ = require(`lodash`);

const { loadOptions } = require(`./plugin-options`);

async function onPreBootstrap({ pathPrefix }, configOptions) {
  loadOptions(_.cloneDeep(configOptions), pathPrefix);
}

module.exports = onPreBootstrap;
