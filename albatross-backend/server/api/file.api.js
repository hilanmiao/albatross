const Joi = require("joi");
const RestHapi = require("rest-hapi");
const moduleName = '/file'

const headersValidation = Joi.object({
    authorization: Joi.string().required()
}).options({ allowUnknown: true })

module.exports = function(server, mongoose, logger) {

};
