'use strict'

const Boom = require('boom')
const Chalk = require('chalk')
const Jwt = require('jsonwebtoken')
const Uuid = require('node-uuid')
const RestHapi = require('rest-hapi')

const Config = require('../../config')

const USER_ROLES = Config.get('/constants/USER_ROLES')
const clientURL = Config.get('/clientURL')

module.exports = function (server, mongoose, logger) {
    /**
     * Shared handler for social auth endpoints. First endpoint to hit for social login with web.
     */

    const socialAuthHandler = function (request, h) {
            const Log = logger.bind(Chalk.magenta('Social Auth'))
            const User = mongoose.model('user')

            if (!request.auth.isAuthenticated) {
                throw Boom.unauthorized(
                    'Authentication failed: ' + request.auth.error.message
                )
            }

            const tokenPayload = {
                username: request.pre.user.username,
                githubId: request.pre.user.githubId,
                googelId: request.pre.user.googelId,
                bitbucketId: request.pre.user.bitbucketId,
                key: request.pre.keyHash.key
            }

            // NOTE: this token has a very short lifespan as it should be used immediately under correct conditions
            const token = Jwt.sign(tokenPayload, Config.get('/jwtSecret'), {
                algorithm: 'HS256',
                expiresIn: '1m'
            })

            const _id = request.pre.user._id

            const update = {
                socialLoginHash: request.pre.keyHash.hash
            }

            // We update the user's social Id just in case they didn't have one yet
            if (request.pre.user.githubId) {
                update.githubId = request.pre.user.githubId
            }
            if (request.pre.user.googleId) {
                update.googleId = request.pre.user.googleId
            }
            if (request.pre.user.bitbucketId) {
                update.bitbucketId = request.pre.user.bitbucketId
            }

            return RestHapi.update(User, _id, update, Log)
                .then(function (user) {
                    const redirectUrl = clientURL + '/login/social'
                    // return h.redirect(redirectUrl + '/?token=' + token)
                    return h.redirect(redirectUrl + '?token=' + token)
                })
                .catch(function (error) {
                    Log.error(error)
                    throw Boom.gatewayTimeout('An error occurred.')
                })
        }

        // Github Auth Endpoint
    ;(function () {
        const Log = logger.bind(Chalk.magenta('Github Auth'))
        const Session = mongoose.model('session')
        const User = mongoose.model('user')
        const Role = mongoose.model('role')

        Log.note('Generating Github Auth endpoint')

        const githubAuthPre = [
            {
                assign: 'user',
                method: async function (request, h) {
                    try {
                        const githubProfile = request.auth.credentials.profile

                        // const realContent = {
                        //     id: 27052900,
                        //     username: 'hilanmiao',
                        //     displayName: 'Lan Miao',
                        //     email: 'hilanmiao@126.com',
                        //     raw: {
                        //         login: 'hilanmiao',
                        //         id: 27052900,
                        //         node_id: 'MDQ6VXNlcjI3MDUyOTAw',
                        //         avatar_url: 'https://avatars1.githubusercontent.com/u/27052900?v=4',
                        //         gravatar_id: '',
                        //         url: 'https://api.github.com/users/hilanmiao',
                        //         html_url: 'https://github.com/hilanmiao',
                        //         followers_url: 'https://api.github.com/users/hilanmiao/followers',
                        //         following_url: 'https://api.github.com/users/hilanmiao/following{/other_user}',
                        //         gists_url: 'https://api.github.com/users/hilanmiao/gists{/gist_id}',
                        //         starred_url: 'https://api.github.com/users/hilanmiao/starred{/owner}{/repo}',
                        //         subscriptions_url: 'https://api.github.com/users/hilanmiao/subscriptions',
                        //         organizations_url: 'https://api.github.com/users/hilanmiao/orgs',
                        //         repos_url: 'https://api.github.com/users/hilanmiao/repos',
                        //         events_url: 'https://api.github.com/users/hilanmiao/events{/privacy}',
                        //         received_events_url: 'https://api.github.com/users/hilanmiao/received_events',
                        //         type: 'User',
                        //         site_admin: false,
                        //         name: 'Lan Miao',
                        //         company: null,
                        //         blog: 'www.smartmiao.com',
                        //         location: 'china',
                        //         email: 'hilanmiao@126.com',
                        //         hireable: null,
                        //         bio: 'web developer',
                        //         public_repos: 27,
                        //         public_gists: 0,
                        //         followers: 9,
                        //         following: 1,
                        //         created_at: '2017-04-08T07:49:42Z',
                        //         updated_at: '2019-07-30T01:25:49Z'
                        //     }
                        // }

                        let user = {}
                        let role = {}
                        let password = {}

                        let promises = []

                        // if the user does not exist, we create one with the github account data
                        promises.push(User.findOne({username: githubProfile.username}))
                        promises.push(User.findOne({githubId: githubProfile.id}))

                        let result = await Promise.all(promises)

                        user = result[0] ? result[0] : result[1]

                        if (user) {
                            user.githubId = githubProfile.id
                            return user
                        } else {
                            result = await RestHapi.list(Role, {name: USER_ROLES.TESTER}, Log)
                        }

                        role = result.docs[0]

                        // TODO：随机密码，如果需要账号密码登录，那么应该有一步设置密码的动作
                        password = Uuid.v4()
                        // password = 'albatross'

                        user = {
                            username: githubProfile.username,
                            email: githubProfile.email,
                            avatar: githubProfile.raw.avatar_url,
                            password: password,
                            githubId: githubProfile.id.toString(),
                            role: role._id,
                            introduction: githubProfile.raw.bio
                        }

                        // Simulated REST Calls
                        user = await RestHapi.create(User, user, Log, true)
                        // user = await RestHapi.create(User, user, Log)

                        // 默认返回的user不携带password，创建session需要使用password
                        user.password = password

                        return user
                    } catch (err) {
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            },
            {
                assign: 'keyHash',
                method: async function (request, h) {
                    try {
                        return await Session.generateKeyHash(Log)
                    } catch (err) {
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            }
        ]

        server.route({
            method: 'GET',
            path: '/auth/github',
            config: {
                handler: socialAuthHandler,
                auth: 'github',
                description: 'Github auth.',
                tags: ['api', 'Github', 'Auth'],
                validate: {},
                pre: githubAuthPre,
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

    // Google Auth Endpoint
    ;(function () {
        const Log = logger.bind(Chalk.magenta('Google Auth'))
        const Session = mongoose.model('session')
        const User = mongoose.model('user')
        const Role = mongoose.model('role')

        Log.note('Generating Google Auth endpoint')

        const googleAuthPre = [
            {
                assign: 'user',
                method: async function (request, h) {
                    try {
                        const googleProfile = request.auth.credentials.profile

                        console.log(googleProfile)
                        // const realContent = {
                        //     id: 27052900,
                        //     username: 'hilanmiao',
                        //     displayName: 'Lan Miao',
                        //     email: 'hilanmiao@126.com',
                        //     raw: {
                        //         login: 'hilanmiao',
                        //         id: 27052900,
                        //         node_id: 'MDQ6VXNlcjI3MDUyOTAw',
                        //         avatar_url: 'https://avatars1.githubusercontent.com/u/27052900?v=4',
                        //         gravatar_id: '',
                        //         url: 'https://api.github.com/users/hilanmiao',
                        //         html_url: 'https://github.com/hilanmiao',
                        //         followers_url: 'https://api.github.com/users/hilanmiao/followers',
                        //         following_url: 'https://api.github.com/users/hilanmiao/following{/other_user}',
                        //         gists_url: 'https://api.github.com/users/hilanmiao/gists{/gist_id}',
                        //         starred_url: 'https://api.github.com/users/hilanmiao/starred{/owner}{/repo}',
                        //         subscriptions_url: 'https://api.github.com/users/hilanmiao/subscriptions',
                        //         organizations_url: 'https://api.github.com/users/hilanmiao/orgs',
                        //         repos_url: 'https://api.github.com/users/hilanmiao/repos',
                        //         events_url: 'https://api.github.com/users/hilanmiao/events{/privacy}',
                        //         received_events_url: 'https://api.github.com/users/hilanmiao/received_events',
                        //         type: 'User',
                        //         site_admin: false,
                        //         name: 'Lan Miao',
                        //         company: null,
                        //         blog: 'www.smartmiao.com',
                        //         location: 'china',
                        //         email: 'hilanmiao@126.com',
                        //         hireable: null,
                        //         bio: 'web developer',
                        //         public_repos: 27,
                        //         public_gists: 0,
                        //         followers: 9,
                        //         following: 1,
                        //         created_at: '2017-04-08T07:49:42Z',
                        //         updated_at: '2019-07-30T01:25:49Z'
                        //     }
                        // }
                        //
                        let user = {}
                        let role = {}
                        let password = {}

                        let promises = []

                        // if the user does not exist, we create one with the github account data
                        promises.push(User.findOne({username: googleProfile.username}))
                        promises.push(User.findOne({googleId: googleProfile.id}))

                        let result = await Promise.all(promises)

                        user = result[0] ? result[0] : result[1]

                        if (user) {
                            user.googleId = googleProfile.id
                            return user
                        } else {
                            result = await RestHapi.list(Role, {name: USER_ROLES.TESTER}, Log)
                        }

                        role = result.docs[0]

                        // TODO：随机密码，如果需要账号密码登录，那么应该有一步设置密码的动作
                        password = Uuid.v4()
                        // password = 'albatross'

                        user = {
                            username: googleProfile.email,
                            email: googleProfile.email,
                            avatar: googleProfile.raw.picture,
                            password: password,
                            googleId: googleProfile.id.toString(),
                            role: role._id,
                            introduction: googleProfile.email
                        }

                        // Simulated REST Calls
                        user = await RestHapi.create(User, user, Log, true)
                        // user = await RestHapi.create(User, user, Log)

                        // 默认返回的user不携带password，创建session需要使用password
                        user.password = password

                        return user
                    } catch (err) {
                        console.log(err)
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            },
            {
                assign: 'keyHash',
                method: async function (request, h) {
                    try {
                        return await Session.generateKeyHash(Log)
                    } catch (err) {
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            }
        ]

        server.route({
            method: 'GET',
            path: '/auth/google',
            config: {
                handler: socialAuthHandler,
                auth: 'google',
                description: 'Google auth.',
                tags: ['api', 'Google', 'Auth'],
                validate: {},
                pre: googleAuthPre,
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

    // Bitbucket Auth Endpoint
    ;(function () {
        const Log = logger.bind(Chalk.magenta('Bitbucket Auth'))
        const Session = mongoose.model('session')
        const User = mongoose.model('user')
        const Role = mongoose.model('role')

        Log.note('Generating Bitbucket Auth endpoint')

        const bitbucketAuthPre = [
            {
                assign: 'user',
                method: async function (request, h) {
                    try {
                        const bitbucketProfile = request.auth.credentials.profile

                        console.log(JSON.stringify(bitbucketProfile))
                        // const realContent = {
                        //     "id":"{1cf882da-4b1c-414d-8d38-a933fe64ab94}",
                        //     "username":"hilanmiao-test",
                        //     "displayName":"hilanmiao",
                        //     "raw":{
                        //         "username":"hilanmiao-test",
                        //         "display_name":"hilanmiao",
                        //         "has_2fa_enabled":null,
                        //         "links":{
                        //             "hooks":{
                        //                 "href":"https://api.bitbucket.org/2.0/users/%7B1cf882da-4b1c-414d-8d38-a933fe64ab94%7D/hooks"
                        //             },
                        //             "self":{
                        //                 "href":"https://api.bitbucket.org/2.0/users/%7B1cf882da-4b1c-414d-8d38-a933fe64ab94%7D"
                        //             },
                        //             "repositories":{
                        //                 "href":"https://api.bitbucket.org/2.0/repositories/%7B1cf882da-4b1c-414d-8d38-a933fe64ab94%7D"
                        //             },
                        //             "html":{
                        //                 "href":"https://bitbucket.org/%7B1cf882da-4b1c-414d-8d38-a933fe64ab94%7D/"
                        //             },
                        //             "avatar":{
                        //                 "href":"https://secure.gravatar.com/avatar/bba4b666d6951005988d018c4650ac04?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FH-4.png"
                        //             },
                        //             "snippets":{
                        //                 "href":"https://api.bitbucket.org/2.0/snippets/%7B1cf882da-4b1c-414d-8d38-a933fe64ab94%7D"
                        //             }
                        //         },
                        //         "nickname":"hilanmiao",
                        //         "account_id":"5d8ed91f707a180dbe8b1dbf",
                        //         "created_on":"2019-09-28T03:55:07.901554+00:00",
                        //         "is_staff":false,
                        //         "account_status":"active",
                        //         "type":"user",
                        //         "uuid":"{1cf882da-4b1c-414d-8d38-a933fe64ab94}"
                        //     }
                        // }

                        let user = {}
                        let role = {}
                        let password = {}

                        let promises = []

                        // if the user does not exist, we create one with the github account data
                        promises.push(User.findOne({username: bitbucketProfile.username}))
                        promises.push(User.findOne({googleId: bitbucketProfile.id}))

                        let result = await Promise.all(promises)

                        user = result[0] ? result[0] : result[1]

                        if (user) {
                            user.bitbucketId = bitbucketProfile.id
                            return user
                        } else {
                            result = await RestHapi.list(Role, {name: USER_ROLES.TESTER}, Log)
                        }

                        role = result.docs[0]

                        // TODO：随机密码，如果需要账号密码登录，那么应该有一步设置密码的动作
                        password = Uuid.v4()
                        // password = 'albatross'

                        user = {
                            username: bitbucketProfile.username,
                            // email: bitbucketProfile.email,
                            avatar: bitbucketProfile.raw.links.avatar.href,
                            password: password,
                            bitbucketId: bitbucketProfile.id.toString(),
                            role: role._id,
                            // introduction: bitbucketProfile.email
                        }

                        // Simulated REST Calls
                        user = await RestHapi.create(User, user, Log, true)
                        // user = await RestHapi.create(User, user, Log)

                        // 默认返回的user不携带password，创建session需要使用password
                        user.password = password

                        return user
                    } catch (err) {
                        console.log(err)
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            },
            {
                assign: 'keyHash',
                method: async function (request, h) {
                    try {
                        return await Session.generateKeyHash(Log)
                    } catch (err) {
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            }
        ]

        server.route({
            method: 'GET',
            path: '/auth/bitbucket',
            config: {
                handler: socialAuthHandler,
                auth: 'bitbucket',
                description: 'Bitbucket auth.',
                tags: ['api', 'Bitbucket', 'Auth'],
                validate: {},
                pre: bitbucketAuthPre,
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

    // Weixin Auth Endpoint
    ;(function () {
        const Log = logger.bind(Chalk.magenta('Weixin Auth'))
        const Session = mongoose.model('session')
        const User = mongoose.model('user')
        const Role = mongoose.model('role')

        Log.note('Generating Weixin Auth endpoint')

        const weixinAuthPre = [
            {
                assign: 'user',
                method: async function (request, h) {
                    try {
                        const weixinProfile = request.auth.credentials.profile

                        console.log(JSON.stringify(weixinProfile))
                        // const realContent = {
                        //     "openid":"o96DVwVQ2VbKjgZMpnr30ogB_h8Q",
                        //     "nickname":"张国栋",
                        //     "sex":1,
                        //     "language":"zh_CN",
                        //     "city":"Weifang",
                        //     "province":"Shandong",
                        //     "country":"CN",
                        //     "headimgurl":"http://thirdwx.qlogo.cn/mmopen/vi_32/5cFyA1ZQGBCxOhFvUAudqOa481NkPIHVDdf7rLZOjIWJHPiabDbKia3CIyTmkThCWFeqAKBNrYOhT9ufM45Pw/132",
                        //     "privilege":[
                        //
                        //     ],
                        //     "unionid":"ou9a2v-kyFAt_3CZApMy0tWtv3BE"
                        // }

                        let user = {}
                        let role = {}
                        let password = {}

                        let promises = []

                        // if the user does not exist, we create one with the github account data
                        promises.push(User.findOne({username: weixinProfile.unionid}))
                        promises.push(User.findOne({weixinId: weixinProfile.unionid}))

                        let result = await Promise.all(promises)

                        user = result[0] ? result[0] : result[1]

                        if (user) {
                            user.weixinId = weixinProfile.unionid
                            return user
                        } else {
                            result = await RestHapi.list(Role, {name: USER_ROLES.TESTER}, Log)
                        }

                        role = result.docs[0]

                        // TODO：随机密码，如果需要账号密码登录，那么应该有一步设置密码的动作
                        password = Uuid.v4()
                        // password = 'albatross'

                        user = {
                            username: weixinProfile.unionid,
                            // email: bitbucketProfile.email,
                            avatar: weixinProfile.headimgurl,
                            password: password,
                            weixinId: weixinProfile.unionid,
                            role: role._id,
                            // introduction: bitbucketProfile.email
                        }

                        // Simulated REST Calls
                        user = await RestHapi.create(User, user, Log, true)
                        // user = await RestHapi.create(User, user, Log)

                        // 默认返回的user不携带password，创建session需要使用password
                        user.password = password

                        return user
                    } catch (err) {
                        console.log(err)
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            },
            {
                assign: 'keyHash',
                method: async function (request, h) {
                    try {
                        return await Session.generateKeyHash(Log)
                    } catch (err) {
                        Log.error(err)
                        throw Boom.badImplementation(err)
                    }
                }
            }
        ]

        server.route({
            method: 'GET',
            path: '/auth/weixin',
            config: {
                handler: socialAuthHandler,
                auth: 'weixin',
                description: 'Weixin auth.',
                tags: ['api', 'Weixin', 'Auth'],
                validate: {},
                pre: weixinAuthPre,
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
}
