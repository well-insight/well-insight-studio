import { request } from '@/utils'

/**
 * 测试
 * @returns
 */
export function testApi() {
  return request.get('/lowcode/pages')
}
