/* global window */
import { routerRedux } from 'dva/router'
import { login } from 'services/login'

export default {
  namespace: 'login',

  state: {
    loginError: false,
  },

  effects: {
    * login ({
      payload,
    }, { put, call, select }) {
      const data = yield call(login, payload)
      const { locationQuery } = yield select(_ => _.app)
      if (data.status === 0) {
        let tokenData = window.localStorage.getItem('tokenData')
        if (tokenData) {
          // 如果存在则删除
          window.localStorage.removeItem('tokenData')
        }
        window.localStorage.setItem('tokenData', JSON.stringify({
          userInfo: data.data,
          timestamp: new Date().getTime(),
        }))
        const { from } = locationQuery
        yield put({ type: 'app/query' })
        if (from && from !== '/login') {
          yield put(routerRedux.push(from))
        } else {
          yield put(routerRedux.push('/dashboard'))
        }
      } else {
        // throw data
        yield put({ type: 'loginError', payload: data })
      }
    },
  },
  reducers: {
    loginError (state, { payload }) {
      return { ...state, loginError: true }
    },
  },
}
