import myDesign from '@/api/service/custom/myDesign'
import { request } from '..'
import INDEX_API from './custom'
import ASSEMBLY_API from './custom/assembly'
import system from './system'

export { ASSEMBLY_API, INDEX_API, myDesign, system }

export function testApi() {
  return request.get('api/weiDesign/getUsers', {})
}
