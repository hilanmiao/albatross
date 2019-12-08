import {
  getAccessToken, setAccessToken, removeAccessToken,
  getRefreshToken, setRefreshToken, removeRefreshToken
} from '../../utils/auth'
import axios from 'axios'

const state = {
  user: {},
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken()
}

const mutations = {
  SET_USER: (state, user) => {
    state.user = user
  },
  SET_ACCESS_TOKEN: (state, token) => {
    state.accessToken = token
  },
  SET_REFRESH_TOKEN: (state, token) => {
    state.refreshToken = token
  }
}

const actions = {
  updateTokens({ commit }, { accessToken, refreshToken }) {
    axios.defaults.headers.common.Authorization = 'Bearer ' + accessToken
    commit('SET_ACCESS_TOKEN', accessToken)
    commit('SET_REFRESH_TOKEN', refreshToken)
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)

    console.debug('Tokens updated')
  },

  useRefreshToken({ state }) {
    axios.defaults.headers.common.Authorization = 'Bearer ' + state.refreshToken
    console.debug('Using refresh token')
  },

  setAuth({ commit, dispatch }, data) {
    dispatch('updateTokens', data)
  },

  clearAuth({ commit }) {
    axios.defaults.headers.common.Authorization = undefined

    commit('SET_ACCESS_TOKEN', '')
    commit('SET_REFRESH_TOKEN', '')
    commit('SET_USER', {})
    removeAccessToken()
    removeRefreshToken()
  },

  setUserInfo({ commit, dispatch }, data) {
    commit('SET_USER', data)

    console.debug('Set user info')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
