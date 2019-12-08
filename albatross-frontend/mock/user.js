
// const tokens = {
//   admin: {
//     token: 'admin-token'
//   },
//   dev: {
//     token: 'developer-token'
//   },
//   test: {
//     token: 'tester-token'
//   }
// }

// const users = {
//   'admin-token': {
//     roles: [{ roleId: '', roleName: 'administrator' }],
//     introduction: 'I am a super administrator',
//     avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
//     name: 'Super Admin',
//     permissions: []
//   },
//   'developer-token': {
//     roles: [{ roleId: '', roleName: 'developer' }],
//     introduction: 'I am a developer',
//     avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
//     name: 'Developer',
//     permissions: [
//       { role_id: '2', identification: 'sys', type: 'd' },
//       { role_id: '2', identification: 'sys:user', type: 'd' },
//       { role_id: '2', identification: 'sys:user:add', type: 'd' },
//       { role_id: '2', identification: 'sys:user:edit', type: 'd' },
//       { role_id: '2', identification: 'sys:import', type: 'd' },
//       { role_id: '2', identification: 'plugin', type: 'd' },
//       { role_id: '2', identification: 'plugin:vue-pdf', type: 'd' },
//       { role_id: '2', identification: 'plugin:vue-pdf:test', type: 'd' },
//       { role_id: '2', identification: 'plugin:html2canvas', type: 'd' },
//       { role_id: '2', identification: 'plugin:html2canvas:test', type: 'd' }
//     ]
//   },
//   'tester-token': {
//     roles: [{ roleId: '', roleName: 'tester' }],
//     introduction: 'I am a tester',
//     avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
//     name: 'Tester',
//     permissions: [
//       { role_id: '3', identification: 'test', type: 'd' },
//       { role_id: '3', identification: 'test:index', type: 'd' },
//       { role_id: '3', identification: 'test:index:test', type: 'd' }
//     ]
//   }
// }

export default [
  // user login
  // {
  //   url: '/user/login',
  //   type: 'post',
  //   response: config => {
  //     const { username } = config.body
  //     const token = tokens[username]
  //
  //     // mock error
  //     if (!token) {
  //       return {
  //         code: 60204,
  //         message: 'Account and password are incorrect.'
  //       }
  //     }
  //
  //     return {
  //       code: 20000,
  //       data: token
  //     }
  //   }
  // },

  // get user info
  // {
  //   url: '/user/info\.*',
  //   type: 'get',
  //   response: config => {
  //     const { token } = config.query
  //     const info = users[token]
  //
  //     // mock error
  //     if (!info) {
  //       return {
  //         code: 50008,
  //         message: 'Login failed, unable to get user details.'
  //       }
  //     }
  //
  //     return {
  //       code: 20000,
  //       data: info
  //     }
  //   }
  // },

  // user logout
  // {
  //   url: '/auth/logout',
  //   type: 'post',
  //   response: _ => {
  //     return {
  //       code: 20000,
  //       data: 'success'
  //     }
  //   }
  // }
]
