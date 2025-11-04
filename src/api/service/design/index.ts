import request from '@/utils/request'

export async function fetchComponentsList() {
  return await request.post('api/weiDesign/getComponentsList', {})
}
