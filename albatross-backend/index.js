'use strict'
const Glue = require('glue')
const RestHapi = require('rest-hapi')
const Manifest = require('./config/manifest.conf')
const mongoose = require('mongoose')

const composeOptions = {
  relativeTo: __dirname
}

const startServer = async function() {
  try {
    // TODO：版本相比rest-hapi过高，有一些弃用警告，源码修复很多地方，暂时搁置
    mongoose.set('useNewUrlParser', true)
    mongoose.set('useFindAndModify', false)
    mongoose.set('useCreateIndex', true)
    mongoose.set('useUnifiedTopology', true)

    const manifest = Manifest.get('/')
    const server = await Glue.compose(manifest, composeOptions)

    await server.start()

    RestHapi.logUtil.logActionComplete(
        RestHapi.logger,
        'Server Initialized',
        server.info
    )
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

startServer()
