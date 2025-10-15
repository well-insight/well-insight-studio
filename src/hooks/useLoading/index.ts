import { ElLoading } from 'element-plus'

let loadingInstance: any = null
export function openLoading(option?: any) {
  option = option || {}
  const options = Object.assign({}, { text: '拼命加载中', background: 'rgba(0, 0, 0, 0.1)' }, option)
  loadingInstance = ElLoading.service(options)
}
export function closeLoading() {
  if (loadingInstance) {
    loadingInstance.close()
  }
}
