'use strict'

const Jwt = require('jsonwebtoken')
const Config = require('../../config')
const errorHelper = require('./error-helper')

function createToken(user, session, expirationPeriod, logger) {
  const Log = logger.bind('token')
  try {
    let token = {}

    if (session) {
      token = Jwt.sign(
        {
          sessionId: session._id,
          sessionKey: session.key,
          passwordHash: session.passwordHash,
        },
        Config.get('/jwtSecret'),
        { algorithm: 'HS256', expiresIn: expirationPeriod }
      )
    } else {
      const tokenUser = {
        username: user.username,
        role: user.role,
        roleName: user.roleName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        _id: user._id
      }

      console.log(tokenUser)

      token = Jwt.sign(
        {
          user: tokenUser
        },
        Config.get('/jwtSecret'),
        { algorithm: 'HS256', expiresIn: expirationPeriod }
      )
    }

    return token
  } catch (err) {
    errorHelper.handleError(err, Log)
  }
}

module.exports = createToken
