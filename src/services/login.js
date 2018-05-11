import { request, config } from 'utils'

const { API_ROOT } = config

export function login (data) {
  return request({
    url: `${API_ROOT}user/login`,
    method: 'post',
    data,
  })
}
