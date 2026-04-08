import { request } from "@/utils";

/**
 * 测试
 * @returns
 */
export const testApi = () => {
  return request.get("/lowcode/pages");
};
