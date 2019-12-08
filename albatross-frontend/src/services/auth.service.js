import store from '../store'

import { httpClient as http } from '../services'

const internals = {}

internals.login = credentials => {
  return http
    .post('/login', credentials)
    .then(response => {
      store.dispatch('auth/setAuth', response.data)
    })
    .catch(error => {
      console.error('authService.login-error:\n', error)
      throw error
    })
}

internals.logout = () => {
  store.dispatch('auth/useRefreshToken')
  return http
    .delete('/logout')
    .then(response => {
      store.dispatch('auth/clearAuth')
    })
    .catch(error => {
      console.error('authService.logout-error:\n', error)
      throw error
    })
}

internals.getUserInfo = () => {
  return http
    .get('/user/userInfo')
    .then(response => {
      store.dispatch('auth/setUserInfo', response.data)
    })
    .catch(error => {
      console.error('authService.logout-error:\n', error)
      throw error
    })
}

internals.loginSocial = token => {
  return http
    .post('login/social', { token })
    .then(response => {
      store.dispatch('auth/setAuth', response.data)
    })
    .catch(error => {
      console.error('authService.loginSocial-error:\n', error)
      throw error
    })
}

export default internals
