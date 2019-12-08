'use strict'

const Bcrypt = require('bcryptjs')
const GeneratePassword = require('password-generator')
const RestHapi = require('rest-hapi')
const errorHelper = require('../utilities/error-helper')

module.exports = function(mongoose) {
  let modelName = "user";
  let Types = mongoose.Schema.Types;
  let Schema = new mongoose.Schema({
    username: {
      type: Types.String,
      unique: true,
      required: true,
      allowOnUpdate: false
    },
    password: {
      type: Types.String,
      required: true,
      exclude: true,
      allowOnUpdate: false
    },
    email: {
      type: Types.String,
      stringType: 'email'
    },
    mobile: {
      type: Types.String
    },
    avatar: {
      type: Types.String
    },
    introduction: {
      type: Types.String
    },
    // remark:  {
    //   type: Types.String
    // },
    role: {
      type: Types.ObjectId,
      ref: 'role'
    },
    isEnabled: {
      type: Types.Boolean,
      allowOnUpdate: false,
      default: true
    },
    githubId: {
      type: Types.String,
      allowOnUpdate: false
    },
    googleId: {
      type: Types.String,
      allowOnUpdate: false
    },
    bitbucketId: {
      type: Types.String,
      allowOnUpdate: false
    },
    weixinId: {
      type: Types.String,
      allowOnUpdate: false
    },
    socialLoginHash: {
      allowOnCreate: false,
      allowOnUpdate: false,
      exclude: true,
      type: Types.String
    }
  });

  Schema.statics = {
    collectionName: modelName,
    routeOptions: {
      associations: {
        role: {
          type: 'MANY_ONE',
          model: 'role',
          // duplicate: ['name']
        },
        department: {
          type: 'MANY_ONE',
          model: 'department'
        }
      },
      create: {
        pre: async function(payload, request, logger) {
          const Log = logger.bind()
          try {
            if (!payload.password) {
              payload.password = GeneratePassword(10, false)
            }

            const promises = []

            promises.push(
                mongoose.model('user').generateHash(payload.password, Log)
            )

            let result = await Promise.all(promises)
            payload.password = result[0].hash

            return payload
          } catch (err) {
            errorHelper.handleError(err, Log)
          }
        },
        post: async function(document, request, result, logger) {
          // gravatar 头像
          const Log = logger.bind()
          try {
            const User = mongoose.model('user')
            if (!document.avatar) {
              let avatar =
                  'https://www.gravatar.com/avatar/' +
                  document._id +
                  '?r=PG&d=robohash'
              return await RestHapi.update(
                  User,
                  document._id,
                  { avatar },
                  Log
              )
            } else {
              return document
            }
          } catch (err) {
            errorHelper.handleError(err, Log)
          }
        }
      }
    },

    generateHash: async function(key, logger) {
      const Log = logger.bind()
      try {
        let salt = await Bcrypt.genSalt(10)
        let hash = await Bcrypt.hash(key, salt)
        return { key, hash }
      } catch (err) {
        errorHelper.handleError(err, Log)
      }
    },

    findByCredentials: async function(username, password, logger) {
      const Log = logger.bind()
      try {
        const self = this

        const query = {
          username: username.toLowerCase(),
          isDeleted: false
        }

        let mongooseQuery = self.findOne(query)

        let user = await mongooseQuery.lean()

        if (!user) {
          return false
        }

        const source = user.password

        let passwordMatch = await Bcrypt.compare(password, source)
        if (passwordMatch) {
          return user
        } else {
          return false
        }
      } catch (err) {
        errorHelper.handleError(err, Log)
      }
    }
  }

  return Schema
}
