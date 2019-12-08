'use strict'

const Confidence = require('confidence')
const Dotenv = require('dotenv')
const path = require('path')

Dotenv.config({ silent: true })

/**
 * NOTE: Only secrets and values affected by the environment (not NODE_ENV) are stored in .env files. All other values
 * are defined here.
 */

// The criteria to filter config values by (NODE_ENV). Typically includes:
//  - local
//  - development
//  - production
//  - $default

const criteria = {
    env: process.env.NODE_ENV
}

// These values stay the same regardless of the environment.
const constants = {
    USER_ROLES: {
        ADMINISTRATOR: 'administrator',
        DEVELOPER: 'developer',
        TESTER: 'tester'
    },
    AUTH_STRATEGIES: {
        TOKEN: 'standard-jwt',
        SESSION: 'jwt-with-session',
        REFRESH: 'jwt-with-session-and-refresh-token'
    },
    EXPIRATION_PERIOD: { // 到期期限
        SHORT: '10m',
        MEDIUM: '4h',
        LONG: '730h'
    },
    AUTH_ATTEMPTS: { // 认证尝试次数
        FOR_IP: 50,
        FOR_IP_AND_USER: 5
    },
    LOCKOUT_PERIOD: 30, // 锁定期限 in units of minutes
    API_TITLE: 'albatross API',
    WEB_TITLE: 'albatross Admin'
}

const config = {
    $meta: 'This file configures the albatross API.',
    constants: constants,
    projectName: constants.API_TITLE,
    jwtSecret: {
        $filter: 'env',
        production: process.env.JWT_SECRET,
        $default: process.env.JWT_SECRET
    },
    port: {
        $filter: 'env',
        production: process.env.SERVER_PORT,
        $default: process.env.SERVER_PORT
    },
    clientURL: {
        $filter: 'env',
        production: process.env.CLIENT_URI,
        $default: process.env.CLIENT_URI
    },
    socialPassword: {
        $filter: 'env',
        production: process.env.SOCIAL_PASSWORD,
        $default: process.env.SOCIAL_PASSWORD
    },
    socialIds: {
        $filter: 'env',
        production: {
            github: process.env.GITHUB_ID,
            google: process.env.GOOGLE_ID,
            bitbucket: process.env.BITBUCKET_ID,
            weixin: process.env.WEIXIN_ID
        },
        $default: {
            github: process.env.GITHUB_ID,
            google: process.env.GOOGLE_ID,
            bitbucket: process.env.BITBUCKET_ID,
            weixin: process.env.WEIXIN_ID
        }
    },
    socialSecrets: {
        $filter: 'env',
        production: {
            github: process.env.GITHUB_SECRET,
            google: process.env.GOOGLE_SECRET,
            bitbucket: process.env.BITBUCKET_SECRET,
            weixin: process.env.WEIXIN_SECRET
        },
        $default: {
            github: process.env.GITHUB_SECRET,
            google: process.env.GOOGLE_SECRET,
            bitbucket: process.env.BITBUCKET_SECRET,
            weixin: process.env.WEIXIN_SECRET
        }
    },
    // Enable TLS for social login
    socialSecure: {
        $filter: 'env',
        production: true,
        $default: false
    },
    // This is the config object passed into the rest-hapi plugin during registration:
    // https://github.com/JKHeadley/rest-hapi#configuration
    restHapiConfig: {
        appTitle: constants.API_TITLE,
        mongo: {
            URI: {
                $filter: 'env',
                production: process.env.MONGODB_URI,
                $default: process.env.MONGODB_URI
            }
        },
        cors: {
            additionalHeaders: ['X-Access-Token', 'X-Refresh-Token'],
            additionalExposedHeaders: ['X-Access-Token', 'X-Refresh-Token']
        },
        auditLogTTL: 60,
        absoluteModelPath: true,
        modelPath: path.join(__dirname, '/../server/models'),
        absoluteApiPath: true,
        apiPath: path.join(__dirname, '/../server/api'),
        absolutePolicyPath: true,
        policyPath: path.join(__dirname, '/../server/policies'),
        swaggerHost: {
            $filter: 'env',
            production: process.env.SERVER_HOST,
            $default: `${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`
        },
        authStrategy: {
            $filter: 'env',
            production: constants.AUTH_STRATEGIES.REFRESH,
            $default: constants.AUTH_STRATEGIES.REFRESH
        },
        enableWhereQueries: {
            $filter: 'env',
            production: false,
            $default: false
        },
        enableQueryValidation: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enablePayloadValidation: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enableResponseValidation: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enableTextSearch: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enableSoftDelete: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enablePolicies: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enableDuplicateFields: {
            $filter: 'env',
            production: true,
            $default: true
        },
        trackDuplicatedFields: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enableDocumentScopes: {
            $filter: 'env',
            production: true,
            $default: true
        },
        enableSwaggerHttps: {
            $filter: 'env',
            production: true,
            $default: false
        },
        generateScopes: {
            $filter: 'env',
            production: true,
            $default: true
        },
        logRoutes: {
            $filter: 'env',
            production: false,
            $default: true
        },
        logScopes: {
            $filter: 'env',
            production: false,
            $default: false
        },
        loglevel: {
            $filter: 'env',
            production: 'ERROR',
            $default: 'DEBUG'
        }
    }
}

const store = new Confidence.Store(config)

exports.get = function (key) {
    return store.get(key, criteria)
}

exports.meta = function (key) {
    return store.meta(key, criteria)
}


