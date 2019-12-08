const Joi = require("joi");
const RestHapi = require("rest-hapi");

const headersValidation = Joi.object({
  authorization: Joi.string().required()
}).options({ allowUnknown: true })

module.exports = function(server, mongoose, logger) {
  // Registration endpoint
  (function() {
    const Log = logger.bind("Register");
    const User = mongoose.model("user");

    Log.note("Generating Registration endpoint");

    server.route({
      method: "POST",
      path: "/register",
      config: {
        handler: async function(request, h) {
          const { name, password } = request.payload;
          return await RestHapi.create(User, { name, password }, Log);
        },
        auth: false,
        validate: {
          payload: {
            name: Joi.string()
              .lowercase()
              .required(),
            password: Joi.string().required()
          }
        },
        tags: ["api", "register"],
        plugins: {
          "hapi-swagger": {}
        }
      }
    });
  })();
};
