import type { RequestBody } from 'alova'
import type { ApiResponse } from './alovaConfig'
import { alovaInstance } from './alovaConfig'

const request = {
  /**
   * 通用 GET 请求
   */
  get<T>(url: string, params?: any, config?: any) {
    // Alova 3：Get<Responded, Transformed> — Responded 为 transform 返回值，Transformed 为全局 responded 的产出
    return alovaInstance.Get<T, ApiResponse<T>>(url, {
      params,
      ...config,
      transform: (response: ApiResponse<T>) => {
        if (!response.success) {
          throw new Error(response.error || response.message || '请求失败')
        }
        return response.data as T
      },
    })
  },

  /**
   * 通用 POST 请求
   */
  post<T>(url: string, data?: RequestBody, config?: any) {
    return alovaInstance.Post<T, ApiResponse<T>>(url, data, {
      ...config,
      transform: (response: ApiResponse<T>) => {
        if (!response.success) {
          throw new Error(response.error || response.message || '请求失败')
        }
        return response.data as T
      },
    })
  },

  /**
   * 通用 PUT 请求
   */
  put<T>(url: string, data?: RequestBody, config?: any) {
    return alovaInstance.Put<T, ApiResponse<T>>(url, data, {
      ...config,
      transform: (response: ApiResponse<T>) => {
        if (!response.success) {
          throw new Error(response.error || response.message || '请求失败')
        }
        return response.data as T
      },
    })
  },

  /**
   * 通用 PATCH 请求
   */
  patch<T>(url: string, data?: RequestBody, config?: any) {
    return alovaInstance.Patch<T, ApiResponse<T>>(url, data, {
      ...config,
      transform: (response: ApiResponse<T>) => {
        if (!response.success) {
          throw new Error(response.error || response.message || '请求失败')
        }
        return response.data as T
      },
    })
  },

  /**
   * 通用 DELETE 请求
   */
  delete<T>(url: string, config?: any) {
    return alovaInstance.Delete<T, ApiResponse<T>>(url, {
      ...config,
      transform: (response: ApiResponse<T>) => {
        if (!response.success) {
          throw new Error(response.error || response.message || '请求失败')
        }
        return response.data as T
      },
    })
  },

  /**
   * 上传文件
   */
  uploadFile<T = unknown>(url: string, formData: FormData, onProgress?: (progress: number) => void) {
    return alovaInstance.Post<T, ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event: ProgressEvent) => {
        if (onProgress && event.total > 0) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      },
      transform: (response: ApiResponse<T>) => {
        if (!response.success) {
          throw new Error(response.error || response.message || '请求失败')
        }
        return response.data as T
      },
    })
  },

  /**
   * 下载文件
   * 注意：下载文件通常不遵循 ApiResponse 格式
   */
  downloadFile(url: string, filename: string) {
    return alovaInstance.Get<Blob>(url, {
      headers: {
        Accept: 'application/octet-stream',
      },
      transform: (data: Blob) => {
        // 创建下载链接
        const blobUrl = URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        link.click()
        URL.revokeObjectURL(blobUrl)
        return data
      },
    })
  },
}

export default request
