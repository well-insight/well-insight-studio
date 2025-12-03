import type { assemblyType } from '@/type'
import request from '@/utils/request'

export async function getAssemblyLists(): Promise<assemblyType[]> {
  return await request.post('api/assembly/getAssemblyLists', {})
}
