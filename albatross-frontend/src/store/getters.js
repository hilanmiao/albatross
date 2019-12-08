const getters = {
  sidebar: state => state.app.sidebar,
  language: state => state.app.language,
  size: state => state.app.size,
  device: state => state.app.device,
  permission_routes: state => state.permission.routes,
  user: state => state.auth.user,
  accessToken: state => state.auth.accessToken,
  refreshToken: state => state.auth.refreshToken,
  errorLogs: state => state.errorLog.logs
}
export default getters
