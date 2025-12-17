import request from '@/utils/request'

/**
 * 测试mock
 * @returns
 */
export function getUsers() {
  return request.get('/api/test/get', {})
}
/**
 * 查询目录列表
 * @returns
 */
export function getMenuList() {
  return request.post('/api/system/getMenuList', {})
}
/**
 * 登录
 * @returns
 */
export function login(loginData: {
  username: string
  password: string
}) {
  return request.post('/api/system/login', { username: loginData.username, password: loginData.password })
}

export async function goodDailySentences() {
  return await request.get('https://api.xygeng.cn/one', {})
}

/**
 * 图床验证
 * @param params
 */
export async function uploadPic(data: FormData) {
  return await request.post('https://picui.cn/api/v1/upload', data, { headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_PIC_TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'multipart/form-data',
  } })
}
