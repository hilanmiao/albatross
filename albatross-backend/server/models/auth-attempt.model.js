'use strict'

const Config = require('../../config')
const errorHelper = require('../utilities/error-helper')

module.exports = function(mongoose) {
  const modelName = 'authAttempt'
  const Types = mongoose.Schema.Types
  const Schema = new mongoose.Schema(
    {
      username: {
        type: Types.String,
        required: true
      },
      ip: {
        type: Types.String,
        required: true
      },
      time: {
        type: Types.Date,
        required: true
      }
    },
    { collection: modelName }
  )

  Schema.statics = {
    collectionName: modelName,
    routeOptions: {
      alias: 'auth-attempt'
    },
    createInstance: async function(ip, username, Log) {
      try {
        const document = {
          ip,
          username: username.toLowerCase(),
          time: new Date()
        }

        return await mongoose.model('authAttempt').create(document)
      } catch (err) {
        errorHelper.handleError(err, Log)
      }
    },

    // 滥用检测
    abuseDetected: async function(ip, username, Log) {
      try {
        const self = this

        const LOCKOUT_PERIOD = Config.get('/constants/LOCKOUT_PERIOD')

        // $lt    <   (less  than )
        // $lte    <=  (less than  or equal to )
        // $gt   >    （greater  than ）
        // $gte   >=    (greater  than or   equal to)
        const expirationDate = LOCKOUT_PERIOD
          ? { $gt: Date.now() - LOCKOUT_PERIOD * 60000 }
          : { $lt: Date.now() }

        let query = {
          ip,
          time: expirationDate
        }

        const abusiveIpCount = await self.count(query)
        query = {
          ip,
          username: username.toLowerCase(),
          time: expirationDate
        }

        const abusiveIpUserCount = await self.count(query)

        const AUTH_ATTEMPTS = Config.get('/constants/AUTH_ATTEMPTS')
        const ipLimitReached = abusiveIpCount >= AUTH_ATTEMPTS.FOR_IP
        const ipUserLimitReached =
          abusiveIpUserCount >= AUTH_ATTEMPTS.FOR_IP_AND_USER

        return ipLimitReached || ipUserLimitReached
      } catch (err) {
        errorHelper.handleError(err, Log)
      }
    }
  }

  return Schema
}
