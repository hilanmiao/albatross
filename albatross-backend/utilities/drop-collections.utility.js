'use strict'

process.env.NODE_ENV = 'local'

const mongoose = require('mongoose')
const RestHapi = require('rest-hapi')

/**
 * Drops all of the base collections. Typically before seeding.
 * @param models
 * @returns {*}
 */
async function dropCollections(models) {
  RestHapi.config.loglevel = 'LOG'
  const Log = RestHapi.getLogger('unseed')

  try {
    Log.log('removing users')
    await models.user.remove({})
    Log.log('removing roles')
    await models.role.remove({})
    Log.log('removing department')
    await models.department.remove({})
    Log.log('removing permissions')
    await models.permission.remove({})
    Log.log('removing sessions')
    await models.session.remove({})
    Log.log('removing authAttempts')
    await models.authAttempt.remove({})

  } catch (err) {
    Log.error(err)
    throw err
  }
}

module.exports = dropCollections
