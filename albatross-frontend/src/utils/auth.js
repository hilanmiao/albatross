const AccessToken = 'accessToken'
const RefreshToken = 'refreshToken'

export function getAccessToken() {
  return localStorage.getItem(AccessToken)
}

export function setAccessToken(token) {
  return localStorage.setItem(AccessToken, token)
}

export function removeAccessToken() {
  return localStorage.removeItem(AccessToken)
}

export function getRefreshToken() {
  return localStorage.getItem(RefreshToken)
}

export function setRefreshToken(token) {
  return localStorage.setItem(RefreshToken, token)
}

export function removeRefreshToken() {
  return localStorage.removeItem(RefreshToken)
}

