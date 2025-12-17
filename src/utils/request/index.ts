import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Axios from 'axios'
import { ElMessage } from 'element-plus'

import { ResultEnum } from '@/enums/request-enum'

import { useStorage } from '@/hooks/useStorage'
import NProgress from '../progress'

type AxiosConfig = {
  requestToken?: boolean
} & AxiosRequestConfig

// 默认 axios 实例请求配置
const configDefault = {
  // headers: {
  //   "Content-Type": ContentTypeEnum.FORM_URLENCODED
  // },
  timeout: 0,
  baseURL: import.meta.env.VITE_BASE_API,
  data: {},
}

const { get } = useStorage('session')

class Http {
  // 当前实例
  private static axiosInstance: AxiosInstance
  // 请求配置
  private static axiosConfigDefault: AxiosRequestConfig

  // 请求拦截
  private httpInterceptorsRequest(): void {
    Http.axiosInstance.interceptors.request.use(
      (config) => {
        NProgress.start()
        // 发送请求前，可在此携带 token
        if ((config as AxiosConfig).requestToken !== false) {
          const token = get('design.token')

          config.headers['tsy-cors-token'] = token || ''
        }
        delete (config as AxiosConfig).requestToken
        // if (token) {
        //   config.headers['token'] = token
        // }
        return config
      },
      (error: AxiosError) => {
        console.error(error.message)
        return Promise.reject(error)
      },
    )
  }

  // 响应拦截
  private httpInterceptorsResponse(): void {
    Http.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        NProgress.done()
        // 与后端协定的返回字段
        const { data } = response.data
        // 判断请求是否成功
        const isSuccess = checkIsSuccess(response)
        if (isSuccess) {
          return data
        }
        else {
          // 处理请求错误
          ElMessage.error(response.data?.message || response.data?.msg)
          console.error(response.data?.message || response.data?.msg)
          return Promise.reject(response.data)
        }
      },
      (error: AxiosError) => {
        NProgress.done()
        // 处理 HTTP 网络错误
        let message = ''
        // HTTP 状态码
        const status = error.response?.status
        switch (status) {
          case 400:
            message = '请求错误'
            break
          case 401:
            message = '未授权，请登录'
            break
          case 403:
            message = '拒绝访问'
            break
          case 404:
            message = `请求地址出错: ${error.response?.config?.url}`
            break
          case 408:
            message = '请求超时'
            break
          case 500:
            message = '服务器内部错误'
            break
          case 501:
            message = '服务未实现'
            break
          case 502:
            message = '网关错误'
            break
          case 503:
            message = '服务不可用'
            break
          case 504:
            message = '网关超时'
            break
          case 505:
            message = 'HTTP版本不受支持'
            break
          default:
            message = '网络连接故障'
        }

        console.error(message)
        return Promise.reject(error)
      },
    )
  }

  constructor(config: AxiosRequestConfig) {
    Http.axiosConfigDefault = config
    Http.axiosInstance = Axios.create(config)
    this.httpInterceptorsRequest()
    this.httpInterceptorsResponse()
  }

  // 通用请求函数
  public request<T>(paramConfig: AxiosRequestConfig): Promise<T> {
    const config = { ...Http.axiosConfigDefault, ...paramConfig }

    // 如果有 userId 给所有接口都加上 userId
    // if (config.method === "GET") {
    //   config.params.userId = "111"
    // }
    // if (config.method === "POST") {
    //   config.data.userId = "111"
    // }

    return new Promise((resolve, reject) => {
      Http.axiosInstance
        .request(config)
        .then((response: any) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
}

const http = new Http(configDefault)

export default {
  get<T = any>(url: string, data?: any, config?: AxiosConfig): Promise<T> {
    return http.request({
      method: 'GET',
      url,
      params: data,
      ...config,
    })
  },
  post<T = any>(url: string, data?: any, config?: AxiosConfig): Promise<T> {
    return http.request({ method: 'POST', url, data, ...config })
  },
  put<T = any>(url: string, data?: any, config?: AxiosConfig): Promise<T> {
    return http.request({ method: 'PUT', url, data, ...config })
  },
  delete<T = any>(url: string, data?: any, config?: AxiosConfig): Promise<T> {
    return http.request({ method: 'DELETE', url, data, ...config })
  },
}

function checkIsSuccess(response: AxiosResponse<any>) {
  const { code, status } = response?.data || {}
  return code === ResultEnum.SUCCESS || status === true || status === ResultEnum.SUCCESS
}
