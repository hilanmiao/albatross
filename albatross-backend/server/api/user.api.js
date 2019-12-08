'use strict'

const Joi = require('joi')
const Boom = require('boom')
const Chalk = require('chalk')
const RestHapi = require('rest-hapi')
const errorHelper = require('../utilities/error-helper')

const Config = require('../../config')
const auditLog = require('../policies/audit-log.policy')

const authStrategy = Config.get('/restHapiConfig/authStrategy')
const cors = Config.get('/restHapiConfig/cors')

const headersValidation = Joi.object({
    authorization: Joi.string().required()
}).options({ allowUnknown: true })

module.exports = function(server, mongoose, logger) {
    // Get user info endpoint by token
    ;(function () {
        const Log = logger.bind('UserInfo')
        const User = mongoose.model('user')
        const Role = mongoose.model('role')
        const Permission = mongoose.model('permission')
        const Boom = require('boom')

        Log.note('Get User Info endpoint')

        const getUserInfoHandler = async function (request, h) {
            const _id = request.auth.credentials.user._id
            let response = {}

            let user = await RestHapi.find(User, _id, {}, Log)

            if(!user) {
                throw Boom.notFound('User not found.')
            }

            let role = await RestHapi.find(Role, user.role, {}, Log)

            let permissions = await RestHapi.list(Permission, { role: user.role }, Log)
            permissions = permissions.docs.map(item => ({
                identification: item.identification,
                type: item.type
            }))

            user.roles = [{roleId: role._id, roleName: role.name}],
            user.permissions= permissions

            response = user

            return response
        }

        server.route({
            method: 'GET',
            path: '/user/userInfo',
            config: {
                // TODO：自定义的api没有继承配置，还是说最好不要？
                cors,
                handler: getUserInfoHandler,
                auth: {
                    strategy: authStrategy,
                },
                description: 'Get user info by token',
                tags: ['api', 'User', 'Get user info by token'],
                validate: {
                    headers: headersValidation
                },
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [
                            { code: 200, message: 'Success' },
                            { code: 400, message: 'Bad Request' },
                            { code: 404, message: 'Not Found' },
                            { code: 500, message: 'Internal Server Error' }
                        ]
                    },
                    policies: [auditLog(mongoose, { payloadFilter: [] }, Log)]
                }
            }
        })
    })()

    // Update Current User Password Endpoint
    ;(function() {
        const Log = logger.bind(Chalk.magenta('Update Current User Password'))
        const User = mongoose.model('user')

        const collectionName = User.collectionDisplayName || User.modelName

        Log.note(
            'Generating Update Current User Password endpoint for ' + collectionName
        )

        const updateCurrentUserPasswordPre = [
            {
                assign: 'password',
                method: async function(request, h) {
                    try {
                        let hashedPassword = await User.generateHash(
                            request.payload.password,
                            Log
                        )
                        return hashedPassword
                    } catch (err) {
                        errorHelper.handleError(err, Log)
                    }
                }
            }
        ]

        const updateCurrentUserPasswordHandler = async function(request, h) {
            try {
                const _id = request.auth.credentials.user._id

                return await RestHapi.update(
                    User,
                    _id,
                    {
                        password: request.pre.password.hash,
                        passwordUpdateRequired: false
                    },
                    Log
                )
            } catch (err) {
                errorHelper.handleError(err, Log)
            }
        }

        server.route({
            method: 'PUT',
            path: '/user/my/password',
            config: {
                handler: updateCurrentUserPasswordHandler,
                auth: {
                    strategy: authStrategy,
                },
                description: 'Update current user password.',
                tags: ['api', 'User', 'Update Current User Password'],
                validate: {
                    headers: headersValidation,
                    payload: {
                        password: Joi.string().required()
                    }
                },
                pre: updateCurrentUserPasswordPre,
                plugins: {
                    'hapi-swagger': {
                        responseMessages: [
                            { code: 200, message: 'Success' },
                            { code: 400, message: 'Bad Request' },
                            { code: 404, message: 'Not Found' },
                            { code: 500, message: 'Internal Server Error' }
                        ]
                    },
                    policies: [auditLog(mongoose, { payloadFilter: [] }, Log)]
                }
            }
        })
    })()
}
