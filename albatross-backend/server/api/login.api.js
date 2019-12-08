// const Joi = require("joi");
// const RestHapi = require("rest-hapi");
//
// const headersValidation = Joi.object({
//   authorization: Joi.string().required()
// }).options({ allowUnknown: true })
//
// module.exports = function(server, mongoose, logger) {
//   // Login Endpoint
//   (function() {
//     const Log = logger.bind("Login");
//     const User = mongoose.model("user");
//
//     const Boom = require("boom");
//
//     Log.note("Generating Login endpoint");
//
//     const loginHandler = async function(request, h) {
//       let token = "";
//       let response = {};
//
//       let user = await User.findByCredentials(
//         request.payload.name,
//         request.payload.password,
//         Log
//       );
//
//       if (!user) {
//         throw Boom.unauthorized("Invalid Name or Password.");
//       }
//
//       delete user.password;
//
//       token = server.methods.createToken(user);
//
//       response = {
//         user,
//         token
//       };
//
//       return response;
//     };
//
//     server.route({
//       method: "POST",
//       path: "/login",
//       config: {
//         handler: loginHandler,
//         auth: false,
//         validate: {
//           payload: {
//             name: Joi.string()
//               .lowercase()
//               .required(),
//             password: Joi.string().required()
//           }
//         },
//         tags: ["api", "login"],
//         plugins: {
//           "hapi-swagger": {}
//         }
//       }
//     });
//   })();
//
// };

'use strict'

const Joi = require('joi')
const Boom = require('boom')
const Bcrypt = require('bcryptjs')
const Chalk = require('chalk')
const Jwt = require('jsonwebtoken')
const RestHapi = require('rest-hapi')

const Config = require('../../config')
const Token = require('../utilities/create-token')
const errorHelper = require('../utilities/error-helper')
const auditLog = require('../policies/audit-log.policy')

const AUTH_STRATEGIES = Config.get('/constants/AUTH_STRATEGIES')
const EXPIRATION_PERIOD = Config.get('/constants/EXPIRATION_PERIOD')
const WEB_TITLE = Config.get('/constants/WEB_TITLE')
const authStrategy = Config.get('/restHapiConfig/authStrategy')

module.exports = function (server, mongoose, logger) {
    /// /////////////////////
    // region LOGIN ENDPOINTS
    /// /////////////////////
    ;(function () {
        const Log = logger.bind(Chalk.magenta('Login'))
        const AuthAttempt = mongoose.model('authAttempt')
        const Permission = mongoose.model('permission')
        const Session = mongoose.model('session')
        const User = mongoose.model('user')

        const loginPre = [
            {
                assign: 'abuseDetected',
                method: async function (request, h) {
                    try {

                        const ip = server.methods.getIP(request)
                        const username = request.payload.username

                        let detected = await AuthAttempt.abuseDetected(ip, username, Log)
                        if (detected) {
                            throw Boom.unauthorized(
                                'Maximum number of auth attempts reached. Please try again later.'
                            )
                        }

                        return h.continue
                    } catch (err) {
                        errorHelper.handleError(err, Log)
                    }
                }
            },
            {
                assign: 'user',
                method: async function (request, h) {
                    try {
                        const username = request.payload.username
                        const password = request.payload.password

                        return await User.findByCredentials(username, password, Log)
                    } catch (err) {
                        errorHelper.handleError(err, Log)
                    }
                }
            },
            {
                assign: 'logAttempt',
                method: async function (request, h) {
                    try {
                        if (request.pre.user) {
                            return h.continue
                        }
                        const ip = server.methods.getIP(request)
                        const username = request.payload.username

                        await AuthAttempt.createInstance(ip, username, Log)

                        throw Boom.unauthorized('Invalid Username or Password.')
                    } catch (err) {
                        errorHelper.handleError(err, Log)
                    }
                }
            },
            {
                assign: 'isEnabled',
                method: function (request, h) {
                    if (!request.pre.user.isEnabled) {
                        throw Boom.unauthorized('Account is disabled.')
                    }
                    return h.continue
                }
            },
            {
                assign: 'isDeleted',
                method: function (request, h) {
                    const user = request.pre.user

                    if (user.isDeleted) {
                        throw Boom.badRequest('Account is deleted.')
                    }
                    return h.continue
                }
            },
            {
                assign: 'session',
                method: async function (request, h) {
                    try {
                        if (authStrategy === AUTH_STRATEGIES.TOKEN) {
                            return h.continue
                        } else {
                            return await Session.createInstance(request.pre.user, Log)
                        }
                    } catch (err) {
                        errorHelper.handleError(err, Log)
                    }
                }
            },
            {
                assign: 'standardToken',
                method: function (request, h) {
                    switch (authStrategy) {
                        case AUTH_STRATEGIES.TOKEN:
                            return Token(
                                request.pre.user,
                                null,
                                EXPIRATION_PERIOD.LONG,
                                Log
                            )
                        case AUTH_STRATEGIES.SESSION:
                            return h.continue
                        case AUTH_STRATEGIES.REFRESH:
                            return Token(
                                request.pre.user,
                                null,
                                EXPIRATION_PERIOD.SHORT,
                                Log
                            )
                        default:
                            return h.continue
                    }
                }
            },
            {
                assign: 'sessionToken',
                method: function (request, h) {
                    switch (authStrategy) {
                        case AUTH_STRATEGIES.TOKEN:
                            return h.continue
                        case AUTH_STRATEGIES.SESSION:
                            return Token(
                                null,
                                request.pre.session,
                                EXPIRATION_PERIOD.LONG,
                                Log
                            )
                        case AUTH_STRATEGIES.REFRESH:
                            return h.continue
                        default:
                            return h.continue
                    }
                }
            },
            {
                assign: 'refreshToken',
                method: function (request, h) {
                    switch (authStrategy) {
                        case AUTH_STRATEGIES.TOKEN:
                            return h.continue
                        case AUTH_STRATEGIES.SESSION:
                            return h.continue
                        case AUTH_STRATEGIES.REFRESH:
                            return Token(
                                null,
                                request.pre.session,
                                EXPIRATION_PERIOD.LONG,
                                Log
                            )
                        default:
                            return h.continue
                    }
                }
            }
        ]

        const loginHandler = function (request, h) {
                let accessToken = ''
                let response = {}

                request.pre.user.password = ''

                switch (authStrategy) {
                    case AUTH_STRATEGIES.TOKEN:
                        accessToken = request.pre.standardToken
                        response = {
                            user: request.pre.user,
                            accessToken
                        }
                        break
                    case AUTH_STRATEGIES.SESSION:
                        accessToken = request.pre.sessionToken
                        response = {
                            user: request.pre.user,
                            accessToken
                        }
                        break
                    case AUTH_STRATEGIES.REFRESH:
                        accessToken = request.pre.standardToken
                        response = {
                            user: request.pre.user,
                            refreshToken: request.pre.refreshToken,
                            accessToken
                        }
                        break
                    default:
                        return h.continue
                }

                return response
            }

            // Login Endpoint
        ;(function () {
            Log.note('Generating Login endpoint')

            server.route({
                method: 'POST',
                path: '/login',
                config: {
                    handler: loginHandler,
                    auth: null,
                    description: 'User login.',
                    tags: ['api', 'Login'],
                    validate: {
                        payload: {
                            username: Joi.string().lowercase().required(),
                            password: Joi.string().required()
                        }
                    },
                    pre: loginPre,
                    plugins: {
                        'hapi-swagger': {
                            responseMessages: [
                                {code: 200, message: 'Success'},
                                {code: 400, message: 'Bad Request'},
                                {code: 404, message: 'Not Found'},
                                {code: 500, message: 'Internal Server Error'}
                            ]
                        },
                        policies: [auditLog(mongoose, {payloadFilter: ['username']}, Log)]
                    }
                }
            })
        })()

        // Social Login Endpoint (for web)
        ;(function() {
            Log.note('Generating Social Login endpoint')

            const socialLoginPre = [
                {
                    assign: 'decoded',
                    method: async function (request, h) {
                        try {
                            let promise = new Promise((resolve, reject) => {
                                Jwt.verify(
                                    request.payload.token,
                                    Config.get('/jwtSecret'),
                                    function (err, decoded) {
                                        if (err) {
                                            Log.error(err)
                                            reject(Boom.unauthorized('Invalid username or key.'))
                                        }

                                        resolve(decoded)
                                    }
                                )
                            })

                            return await promise
                        } catch (err) {
                            errorHelper.handleError(err, Log)
                        }
                    }
                },
                {
                    assign: 'user',
                    method: async function (request, h) {
                        try {
                            const conditions = {}

                            if (request.pre.decoded.githubId) {
                                conditions.githubId = request.pre.decoded.githubId
                            } else if (request.pre.decoded.username) {
                                conditions.username = request.pre.decoded.username
                            }

                            conditions.isDeleted = false

                            let user = await User.findOne(conditions)
                            if (!user) {
                                throw Boom.unauthorized('Invalid username or key.')
                            }
                            return user
                        } catch (err) {
                            errorHelper.handleError(err, Log)
                        }
                    }
                },
                {
                    assign: 'isEnabled',
                    method: function (request, h) {
                        if (!request.pre.user.isEnabled) {
                            throw Boom.unauthorized('Account is disabled.')
                        }
                        return h.continue
                    }
                },
                {
                    assign: 'isDeleted',
                    method: function (request, h) {
                        if (request.pre.user.isDeleted) {
                            throw Boom.badRequest('Account is deleted.')
                        }
                        return h.continue
                    }
                },
                {
                    assign: 'session',
                    method: async function (request, h) {
                        try {
                            if (authStrategy === AUTH_STRATEGIES.TOKEN) {
                                return h.continue
                            } else {
                                return await Session.createInstance(request.pre.user, Log)
                            }
                        } catch (err) {
                            errorHelper.handleError(err, Log)
                        }
                    }
                },
                {
                    assign: 'standardToken',
                    method: function (request, h) {
                        switch (authStrategy) {
                            case AUTH_STRATEGIES.TOKEN:
                                return Token(
                                    request.pre.user,
                                    null,
                                    EXPIRATION_PERIOD.LONG,
                                    Log
                                )
                            case AUTH_STRATEGIES.SESSION:
                                return h.continue
                            case AUTH_STRATEGIES.REFRESH:
                                return Token(
                                    request.pre.user,
                                    null,
                                    EXPIRATION_PERIOD.SHORT,
                                    Log
                                )
                            default:
                                break
                        }
                    }
                },
                {
                    assign: 'sessionToken',
                    method: function (request, h) {
                        switch (authStrategy) {
                            case AUTH_STRATEGIES.TOKEN:
                                return h.continue
                            case AUTH_STRATEGIES.SESSION:
                                return Token(
                                    null,
                                    request.pre.session,
                                    EXPIRATION_PERIOD.LONG,
                                    Log
                                )
                            case AUTH_STRATEGIES.REFRESH:
                                return h.continue
                            default:
                                break
                        }
                    }
                },
                {
                    assign: 'refreshToken',
                    method: function (request, h) {
                        switch (authStrategy) {
                            case AUTH_STRATEGIES.TOKEN:
                                return h.continue
                            case AUTH_STRATEGIES.SESSION:
                                return h.continue
                            case AUTH_STRATEGIES.REFRESH:
                                return Token(
                                    null,
                                    request.pre.session,
                                    EXPIRATION_PERIOD.LONG,
                                    Log
                                )
                            default:
                                break
                        }
                    }
                }
            ]

            const socialLoginHandler = async function (request, h) {
                try {
                    const key = request.pre.decoded.key
                    const hash = request.pre.user.socialLoginHash

                    let keyMatch = await Bcrypt.compare(key, hash)
                    if (!keyMatch) {
                        throw Boom.unauthorized('Invalid username or key.')
                    }

                    const _id = request.pre.user._id
                    const update = {
                        $unset: {
                            socialLoginHash: undefined
                        }
                    }

                    let user = await RestHapi.update(User, _id, update, Log)

                    let accessToken = ''
                    let response = {}

                    switch (authStrategy) {
                        case AUTH_STRATEGIES.TOKEN:
                            accessToken = 'Bearer ' + request.pre.standardToken
                            response = {
                                user: user,
                                accessToken
                            }
                            break
                        case AUTH_STRATEGIES.SESSION:
                            accessToken = 'Bearer ' + request.pre.sessionToken
                            response = {
                                user: user,
                                accessToken
                            }
                            break
                        case AUTH_STRATEGIES.REFRESH:
                            accessToken = 'Bearer ' + request.pre.standardToken
                            response = {
                                user: user,
                                refreshToken: request.pre.refreshToken,
                                accessToken
                            }
                            break
                        default:
                            break
                    }

                    return response
                } catch (err) {
                    errorHelper.handleError(err, Log)
                }
            }

            server.route({
                method: 'POST',
                path: '/login/social',
                config: {
                    handler: socialLoginHandler,
                    auth: false,
                    description: 'Social login.',
                    tags: ['api', 'Login', 'Social Login'],
                    validate: {
                        payload: {
                            token: Joi.string().required()
                        }
                    },
                    pre: socialLoginPre,
                    plugins: {
                        'hapi-swagger': {
                            responseMessages: [
                                {code: 200, message: 'Success'},
                                {code: 400, message: 'Bad Request'},
                                {code: 404, message: 'Not Found'},
                                {code: 500, message: 'Internal Server Error'}
                            ]
                        }
                    }
                }
            })
        })()
    })(
        /// /////////////////////
        // endregion
        /// /////////////////////

        // Forgot Password Endpoint
    )
}
