import { users } from './user'

export default [
  // mock get all routes form server
  {
    url: '/role-permission/list',
    type: 'get',
    response: config => {
      const { roldId } = config.query
      return {
        code: 20000,
        data: users[`${roldId}-token`].permissions
      }
    }
  }
]
