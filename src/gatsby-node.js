exports.onPreBootstrap = require(`./on-pre-bootstrap`);
exports.onCreateNode = require(`./on-node-create`).onCreateNode;
exports.setFieldsOnGraphQLNodeType = require(`./extend-node-type`).setFieldsOnGraphQLNodeType;
exports.createPages = require(`./create-pages`);
