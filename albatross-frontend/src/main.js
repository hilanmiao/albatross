import Vue from 'vue'

// Import global styles
import 'normalize.css/normalize.css' // a modern alternative to CSS resets

import Element from 'element-ui'
import './styles/element-variables.scss'

import '@/styles/index.scss' // global css

// Import System requirements
import App from './App'
import store from './store'
import router from './router'

import i18n from './lang' // internationalization
import './icons' // icon
import './permission' // permission control
import './utils/error-log' // error log

import { authInterceptor} from './services'

// Import Helpers for filters
import * as filters from './filters'

// Import plugins
import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'
import moment from 'moment'
import axios from 'axios'
import qs from 'querystring'
import Cookies from 'js-cookie'

/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online! ! !
 */
import { mockXHR } from '../mock'

if (process.env.NODE_ENV === 'development') {
  mockXHR()
}

if (process.env.NODE_ENV === 'production') {
  // mockXHR()

  // TODO：please set your Sentry code
  // 请设置你自己的Sentry代码
  Sentry.init({
    dsn: 'https://e49f4a2d012845628bbdabaa89fe6703@sentry.io/1540453',
    integrations: [new Integrations.Vue({ Vue, attachProps: true })]
  })
}

Vue.use(Element, {
  size: Cookies.get('size') || 'medium', // set element-ui default size
  i18n: (key, value) => i18n.t(key, value)
})

// register global utility filters
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

// Use third-party libraries
// 使用第三方库
Object.defineProperty(Vue.prototype, '$moment', { value: moment })

// 配置axios
axios.defaults.baseURL = process.env.VUE_APP_BASE_API

// Replace default serializer with one that works with Joi validation
axios.defaults.paramsSerializer = function(params) {
  return qs.stringify(params)
}

// Add a response interceptor
axios.interceptors.response.use(function(response) {
  return Promise.resolve(response)
}, authInterceptor.responseError)

// Initialize auth header
axios.defaults.headers.common.Authorization =
  'Bearer ' + store.state.auth.accessToken

Vue.config.productionTip = false

const vm = new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App)
})

export default vm
