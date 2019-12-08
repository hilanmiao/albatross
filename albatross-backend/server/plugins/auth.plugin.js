// const jwtSecret = "NeverShareYourSecret";
// const strategy = "jwt";
//
// module.exports = {
//   plugin: {
//     name: "auth",
//     register
//   },
//   strategy
// };
//
// async function register(server, options) {
//   // await server.register(require("hapi-auth-jwt2/lib/index"));
//
//   const validate = (decodedToken, request, h) => {
//     let { user } = decodedToken;
//     if (!user) {
//       return { isValid: false };
//     }
//     /* check for additional auth requirements if necessary */
//     return {
//       isValid: true,
//       credentials: { user }
//     };
//   };
//
//   server.auth.strategy(strategy, strategy, {
//     key: jwtSecret,
//     validate,
//     verifyOptions: { algorithms: ["HS256"] }
//   });
//
//   server.auth.default(strategy);
//
//   server.method("createToken", createToken, {});
// }
//
// function createToken(user) {
//   const Jwt = require("jsonwebtoken");
//
//   const { name, _id } = user;
//
//   token = Jwt.sign({ user: { name, _id } }, jwtSecret, {
//     algorithm: "HS256",
//     // TODO: 需要做refreshToken
//     expiresIn: "1m"
//     // expiresIn: "7d"
//   });
//
//   return token;
// }

'use strict'

const Mongoose = require('mongoose')
const Boom = require('boom')
const RestHapi = require('rest-hapi')
const errorHelper = require('../utilities/error-helper')

const Config = require('../../config')
const Token = require('../utilities/create-token')

const AUTH_STRATEGIES = Config.get('/constants/AUTH_STRATEGIES')
const EXPIRATION_PERIOD = Config.get('/constants/EXPIRATION_PERIOD')
const socialPassword = Config.get('/socialPassword')
const socialIds = Config.get('/socialIds')
const socialSecrets = Config.get('/socialSecrets')
const isSecure = Config.get('/socialSecure')

const logger = RestHapi.getLogger('albatross')

const internals = {}

module.exports = {
    plugin: {
        name: 'auth',
        register
    }
}

internals.applyTokenStrategy = function(server) {
    // const Log = logger.bind('auth/standard-jwt')

    server.auth.strategy(AUTH_STRATEGIES.TOKEN, 'jwt', {
        key: Config.get('/jwtSecret'),
        verifyOptions: { algorithms: ['HS256'] },

        validate: function(decodedToken, request, h) {
            let { user } = decodedToken

            return {
                isValid: true,
                credentials: { user }
            }
        }
    })
}

internals.applySessionStrategy = function(server) {
    const Log = logger.bind('auth/session')

    server.ext('onPostHandler', function(request, h) {
        const creds = request.auth.credentials

        // send a fresh token in the response
        if (creds && request.response.header) {
            request.response.header(
                'X-Access-Token',
                Token(null, creds.session, EXPIRATION_PERIOD.LONG, Log)
            )
        }

        return h.continue
    })

    server.auth.strategy(AUTH_STRATEGIES.SESSION, 'jwt', {
        key: Config.get('/jwtSecret'),
        verifyOptions: { algorithms: ['HS256'] },

        validate: async function(decodedToken, request, h) {
            const Session = Mongoose.model('session')
            const User = Mongoose.model('user')

            let session = {}
            let { sessionId, sessionKey, passwordHash } = decodedToken

            try {
                session = await Session.findByCredentials(sessionId, sessionKey, Log)
                if (!session) {
                    return { isValid: false }
                }

                let user = await User.findById(session.user)

                if (!user) {
                    return { isValid: false }
                }

                if (user.password !== passwordHash) {
                    return { isValid: false }
                }

                return {
                    isValid: true,
                    credentials: {
                        user,
                        session
                    }
                }
            } catch (err) {
                errorHelper.handleError(err, Log)
            }
        }
    })
}

internals.applyRefreshStrategy = function(server) {
    const Log = logger.bind('auth/refresh')

    server.ext('onPostHandler', function(request, h) {
        const creds = request.auth.credentials

        // if the auth credentials contain session info (i.e. a refresh token), respond with a fresh set of tokens in the header.
        if (creds && creds.session && request.response.header) {
            request.response.header(
                'X-Access-Token',
                Token(creds.user, null, EXPIRATION_PERIOD.SHORT, Log)
            )
            request.response.header(
                'X-Refresh-Token',
                Token(null, creds.session, EXPIRATION_PERIOD.LONG, Log)
            )
        }

        return h.continue
    })

    server.auth.strategy(AUTH_STRATEGIES.REFRESH, 'jwt', {
        key: Config.get('/jwtSecret'),
        verifyOptions: { algorithms: ['HS256'], ignoreExpiration: true },
        validate: async function(decodedToken, request, h) {
            try {
                // if the token is expired, respond with token type so the client can switch to refresh token if necessary
                if (decodedToken.exp < Math.floor(Date.now() / 1000)) {
                    if (decodedToken.user) {
                        throw Boom.unauthorized('Expired Access Token', 'Token', null)
                    } else {
                        throw Boom.unauthorized('Expired Refresh Token', 'Token', null)
                    }
                }

                let user = {}
                let session = {}

                // If the token does not contain session info, then simply authenticate and continue
                if (decodedToken.user) {
                    user = decodedToken.user

                    return {
                        isValid: true,
                        credentials: { user }
                    }
                }
                // If the token does contain session info (i.e. a refresh token), then use the session to
                // authenticate and respond with a fresh set of tokens in the header
                else if (decodedToken.sessionId) {
                    const Session = Mongoose.model('session')
                    const User = Mongoose.model('user')

                    session = await Session.findByCredentials(
                        decodedToken.sessionId,
                        decodedToken.sessionKey,
                        Log
                    )
                    if (!session) {
                        return { isValid: false }
                    }

                    let user = await User.findById(session.user)

                    if (!user) {
                        return { isValid: false }
                    }

                    if (user.password !== decodedToken.passwordHash) {
                        return { isValid: false }
                    }

                    return {
                        isValid: true,
                        credentials: {
                            user,
                            session
                        }
                    }
                }
            } catch (err) {
                errorHelper.handleError(err, Log)
            }
        }
    })
}

internals.applyGithubStrategy = function(server) {
    const googleOptions = {
        provider: 'github',
        password: socialPassword,
        clientId: socialIds.github,
        clientSecret: socialSecrets.github,
        forceHttps: isSecure,
        isSecure // Should be set to true (which is the default) in production
    }

    // Setup the social GitHub login strategy
    server.auth.strategy('github', 'bell', googleOptions)
}

internals.applyGoogleStrategy = function(server) {
    const googleOptions = {
        provider: 'google',
        password: socialPassword,
        clientId: socialIds.google,
        clientSecret: socialSecrets.google,
        forceHttps: isSecure,
        isSecure // Should be set to true (which is the default) in production
    }

    // Setup the social Google login strategy
    server.auth.strategy('google', 'bell', googleOptions)
}

internals.applyBitbucketStrategy = function(server) {
    const bitbucketOptions = {
        provider: 'bitbucket',
        password: socialPassword,
        clientId: socialIds.bitbucket,
        clientSecret: socialSecrets.bitbucket,
        forceHttps: isSecure,
        isSecure // Should be set to true (which is the default) in production
    }

    // Setup the social Google login strategy
    server.auth.strategy('bitbucket', 'bell', bitbucketOptions)
}

internals.applyWeixinStrategy = function(server) {
    const weixinOptions = {
        provider: 'weixin',
        password: socialPassword,
        clientId: socialIds.weixin,
        clientSecret: socialSecrets.weixin,
        forceHttps: isSecure,
        isSecure // Should be set to true (which is the default) in production
    }

    // Setup the social Google login strategy
    server.auth.strategy('weixin', 'bell', weixinOptions)
}

async function register(server, options) {
    const authStrategy = Config.get('/restHapiConfig/authStrategy')

    internals.applyGithubStrategy(server)
    internals.applyGoogleStrategy(server)
    internals.applyBitbucketStrategy(server)
    internals.applyWeixinStrategy(server)

    switch (authStrategy) {
        case AUTH_STRATEGIES.TOKEN:
            internals.applyTokenStrategy(server)
            break
        case AUTH_STRATEGIES.SESSION:
            internals.applySessionStrategy(server)
            break
        case AUTH_STRATEGIES.REFRESH:
            internals.applyRefreshStrategy(server)
            break
        default:
            break
    }

    // TODO: 修改nginx配置获取IP
    // Add helper method to get request ip
    const getIP = function(request) {
        // We check the headers first in case the server is behind a reverse proxy.
        // see: https://ypereirareis.github.io/blog/2017/02/15/nginx-real-ip-behind-nginx-reverse-proxy/
        return (
            request.headers['x-real-ip'] ||
            request.headers['x-forwarded-for'] ||
            request.info.remoteAddress
        )
    }
    server.method('getIP', getIP, {})
}


