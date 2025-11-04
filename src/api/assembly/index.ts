import type { reponseType } from '@/type'
import request from '@/utils/request'

export async function getAssemblyLists(): Promise<reponseType> {
  return await request.post('api/weiDesign/getAssemblyLists', {})
}
