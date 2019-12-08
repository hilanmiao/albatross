// 'use strict'
//
// let path = require('path')
// let mongoose = require('mongoose')
// let RestHapi = require('rest-hapi')
// const Config = require('../config')
//
// ;(async function seed() {
//     RestHapi.config.loglevel = 'DEBUG'
//     RestHapi.config.absoluteModelPath = true
//     RestHapi.config.modelPath = path.join(__dirname, '/../server/models')
//
//     let Log = RestHapi.getLogger('seed')
//     try {
//         mongoose.promise = Promise
//
//         const mongoURI = Config.get('/restHapiConfig/mongo/URI')
//
//         Log.log(mongoURI)
//
//         mongoose.connect(mongoURI, {
//             useMongoClient: true
//         })
//
//         let models = await RestHapi.generateModels(mongoose)
//
//         let password = '123456'
//
//         await dropCollections(models)
//
//         Log.log('seeding roles')
//
//         let roles = [
//             {
//                 name: 'administrator',
//                 remark: 'a user with full permissions'
//             },
//             {
//                 name: 'developer',
//                 remark: 'this is a developer'
//             },
//             {
//                 name: 'tester',
//                 remark: 'this is a tester'
//             }
//         ]
//
//         roles = await RestHapi.create(models.role, roles, Log)
//
//         Log.log('seeding permissions')
//
//         let permissions = [
//             { role: roles[1]._id, identification: 'sys', type: 'd' },
//             { role: roles[1]._id, identification: 'sys:user', type: 'd' },
//             { role: roles[1]._id, identification: 'sys:user:add', type: 'd' },
//             { role: roles[1]._id, identification: 'sys:user:edit', type: 'd' },
//             { role: roles[1]._id, identification: 'sys:import', type: 'd' },
//             { role: roles[1]._id, identification: 'plugin', type: 'd' },
//             { role: roles[1]._id, identification: 'plugin:vue-pdf', type: 'd' },
//             { role: roles[1]._id, identification: 'plugin:vue-pdf:test', type: 'd' },
//             { role: roles[1]._id, identification: 'plugin:html2canvas', type: 'd' },
//             { role: roles[1]._id, identification: 'plugin:html2canvas:test', type: 'd' },
//             { role: roles[2]._id, identification: 'test', type: 'd' },
//             { role: roles[2]._id, identification: 'test:index', type: 'd' },
//             { role: roles[2]._id, identification: 'test:index:test', type: 'd' }
//         ]
//
//         await RestHapi.create(models.permission, permissions, Log)
//
//         Log.log('seeding users')
//
//         let users = [
//             {
//                 username: 'admin',
//                 password: password,
//                 role: roles[0]._id,
//                 introduction: 'I am a super administrator',
//                 avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
//             },
//             {
//                 username: 'dev',
//                 password: password,
//                 role: roles[1]._id,
//                 introduction: 'I am a developer',
//                 avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
//             },
//             {
//                 username: 'test',
//                 password: password,
//                 role: roles[2]._id,
//                 introduction: 'I am a tester',
//                 avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
//             },
//         ]
//
//         await RestHapi.create(models.user, users, Log)
//
//         process.exit()
//     } catch (err) {
//         Log.error(err)
//
//         process.exit()
//     }
// })()
//
// async function dropCollections(models) {
//     RestHapi.config.loglevel = 'LOG'
//     let Log = RestHapi.getLogger('unseed')
//     try {
//         await models.role.remove({})
//         Log.log('roles removed')
//         await models.permission.remove({})
//         Log.log('permissions removed')
//         await models.user.remove({})
//         Log.log('users removed')
//     } catch (err) {
//         Log.error(err)
//     }
// }

'use strict'

process.env.NODE_ENV = 'local'

const path = require('path')
const Mongoose = require('mongoose')
const RestHapi = require('rest-hapi')

const Glue = require('glue')

const dropCollections = require('../utilities/drop-collections.utility')
const Manifest = require('../config/manifest.conf')

const Config = require('../config')

const restHapiConfig = Config.get('/restHapiConfig')

;(async function seed() {
    RestHapi.config.loglevel = 'DEBUG'
    const Log = RestHapi.getLogger('seed')

    try {
        RestHapi.config = restHapiConfig
        RestHapi.config.absoluteModelPath = true
        RestHapi.config.modelPath = path.join(__dirname, '/../server/models')

        let models = await RestHapi.generateModels(Mongoose)

        const composeOptions = {
            relativeTo: path.join(__dirname, '/../')
        }

        const manifest = Manifest.get('/')
        const server = await Glue.compose(manifest, composeOptions)

        await server.start()

        const password = '123456'

        let roles = []
        let permissions = []
        let users = []

        await dropCollections(models)

        Log.log('seeding roles')

        roles = [
            {
                name: 'administrator',
                remark: 'a user with full permissions'
            },
            {
                name: 'developer',
                remark: 'this is a developer'
            },
            {
                name: 'tester',
                remark: 'this is a tester'
            }
        ]

        roles = await RestHapi.create(models.role, roles, Log)

        Log.log('seeding permissions')

        permissions = [
            { role: roles[1]._id, identification: 'sys', type: 'd' },
            { role: roles[1]._id, identification: 'sys:user', type: 'd' },
            { role: roles[1]._id, identification: 'sys:user:add', type: 'd' },
            { role: roles[1]._id, identification: 'sys:user:edit', type: 'd' },
            { role: roles[1]._id, identification: 'sys:import', type: 'd' },
            { role: roles[1]._id, identification: 'plugin', type: 'd' },
            { role: roles[1]._id, identification: 'plugin:vue-pdf', type: 'd' },
            { role: roles[1]._id, identification: 'plugin:vue-pdf:test', type: 'd' },
            { role: roles[1]._id, identification: 'plugin:html2canvas', type: 'd' },
            { role: roles[1]._id, identification: 'plugin:html2canvas:test', type: 'd' },
            { role: roles[2]._id, identification: 'test', type: 'd' },
            { role: roles[2]._id, identification: 'test:index', type: 'd' },
            { role: roles[2]._id, identification: 'test:index:test', type: 'd' }
        ]

        await RestHapi.create(models.permission, permissions, Log)

        Log.log('seeding users')

        users = [
            {
                username: 'admin',
                password: password,
                role: roles[0]._id,
                introduction: 'I am a super administrator',
                // avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
                // avatar: 'https://www.gravatar.com/avatar/' + Mongoose.Types.ObjectId().toString() + '?r=PG&d=robohash'
            },
            {
                username: 'dev',
                password: password,
                role: roles[1]._id,
                introduction: 'I am a developer',
                // avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
                // avatar: 'https://www.gravatar.com/avatar/' + Mongoose.Types.ObjectId().toString() + '?r=PG&d=robohash'
            },
            {
                username: 'test',
                password: password,
                role: roles[2]._id,
                introduction: 'I am a tester',
                // avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
                // avatar: 'https://www.gravatar.com/avatar/' + Mongoose.Types.ObjectId().toString() + '?r=PG&d=robohash'
            },
        ]

        await RestHapi.create(models.user, users, Log)

        Log.log('SEEDING DONE!')

        process.exit(0)
    } catch (err) {
        Log.error(err)

        process.exit(1)
    }
})()
