import { createAlova, type Alova, type Method } from "alova";
import adapterFetch from "alova/fetch";
import axios, { AxiosRequestConfig, type AxiosError } from "axios";
import { getAuthStore } from "@/stores/auth";
import { redirectToLogin } from "@/utils/authNavigation";

// 定义基础响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// 定义分页响应类型
export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}

// API 基础 URL
const BASE_URL =
  import.meta.env.VITE_APP_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3001/api/v1";

/**
 * 创建 Alova 实例（Alova 3.x：createAlova + fetch 适配器）
 */
export const createAlovaInstance = (): Alova<any> => {
  return createAlova({
    baseURL: BASE_URL,
    timeout: 30000,
    requestAdapter: adapterFetch(),
    beforeRequest: async (method: Method) => {
      const headers = (method.config.headers ||= {} as Record<string, string>);

      const authStore = getAuthStore();
      const token = authStore.token;

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
      headers["X-Requested-With"] = "XMLHttpRequest";

      console.log("[API] 请求:", method.type, method.url, method.data);
    },

    responded: {
      onSuccess: async (response: Response) => {
        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");

        if (response.status === 401) {
          console.warn("[API] 认证过期，跳转登录页");
          redirectToLogin();
          if (isJson) {
            try {
              await response.clone().json();
            } catch {
              /* ignore */
            }
          }
          throw new Error("认证已过期，请重新登录");
        }

        if (!isJson) {
          if (!response.ok) {
            const errText = await response.text().catch(() => "");
            console.error("[API] 非 JSON 错误响应:", response.status, errText.slice(0, 200));
            throw new Error(`请求失败 (${response.status})`);
          }
          return response.blob();
        }

        const rawText = await response.text();
        let data: ApiResponse;
        if (!rawText) {
          if (!response.ok) {
            throw new Error(`请求失败 (${response.status})`);
          }
          data = { success: true };
        } else {
          try {
            data = JSON.parse(rawText) as ApiResponse;
          } catch {
            console.error("[API] JSON 解析失败:", rawText.slice(0, 200));
            throw new Error("服务器返回了无效数据");
          }
        }

        console.log("[API] 响应:", response.status, data);

        if (!response.ok) {
          const errorMessage = data.error || data.message || `请求失败 (${response.status})`;
          console.error("[API] HTTP 错误:", errorMessage);
          throw new Error(errorMessage);
        }

        if (!data.success) {
          const errorMessage = data.error || data.message || "请求失败";
          console.error("[API] 业务错误:", errorMessage);
          throw new Error(errorMessage);
        }

        return data;
      },
      onError: (error: unknown) => {
        console.error("[API] 请求错误:", error);
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error("网络连接失败，请检查网络设置");
        }
        throw error;
      },
    },
  });
};

// 全局 Alova 实例
export const alovaInstance = createAlovaInstance();

/**
 * 创建带认证的 Axios 实例（备用方案）
 */
export const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      const authStore = getAuthStore();
      const token = authStore.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      config.headers["X-Requested-With"] = "XMLHttpRequest";
      console.log("[AXIOS] 请求:", config.method, config.url, config.data);

      return config;
    },
    (error) => {
      console.error("[AXIOS] 请求错误:", error);
      return Promise.reject(error);
    },
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      console.log("[AXIOS] 响应:", response.status, response.data);

      if (response.status === 401) {
        redirectToLogin();
        return Promise.reject(new Error("认证已过期，请重新登录"));
      }

      if (!response.data.success) {
        const errorMessage = response.data.error || response.data.message || "请求失败";
        return Promise.reject(new Error(errorMessage));
      }

      return response.data;
    },
    (error: AxiosError) => {
      console.error("[AXIOS] 响应错误:", error);
      const status = error.response?.status;
      if (status === 401) {
        redirectToLogin();
        return Promise.reject(new Error("认证已过期，请重新登录"));
      }
      const body = error.response?.data as { message?: string; error?: string } | undefined;
      const errorMessage = body?.message || body?.error || error.message || "请求失败";
      return Promise.reject(new Error(errorMessage));
    },
  );

  return instance;
};

export const axiosInstance = createAxiosInstance();
