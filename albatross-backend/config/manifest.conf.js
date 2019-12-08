'use strict'
const Confidence = require('confidence')
const Config = require('./index')
const RestHapi = require('rest-hapi')

const criteria = {
    env: process.env.NODE_ENV
}

const manifest = {
    $meta: 'This file defines the server.',
    server: {
        port: Config.get('/port'),
        host: 'localhost',
        routes: {
            cors: {
                origin: ['*']
            },
            validate: {
                failAction: async (request, h, err) => {
                    RestHapi.logger.error(err)
                    throw err
                }
            }
        }
    },
    register: {
        plugins: [
            {
                plugin: 'hapi-auth-jwt2'
            },
            {
                plugin: 'bell'
            },
            {
                plugin: './server/plugins/auth.plugin'
            },
            {
                plugin: './server/plugins/api.plugin'
            }
        ]
    }
}

const store = new Confidence.Store(manifest)

exports.get = function(key) {
    return store.get(key, criteria)
}

exports.meta = function(key) {
    return store.meta(key, criteria)
}
