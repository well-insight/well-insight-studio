import { getAuthStore } from "@/stores/auth";

let redirecting = false;

/**
 * 清除登录态并跳转到登录页（token 失效、401 等）
 * 使用动态 import router，避免与请求层循环依赖。
 */
export function redirectToLogin(redirectOverride?: string): void {
  if (redirecting) return;

  getAuthStore().logout();

  redirecting = true;
  void import("@/router")
    .then(({ default: router }) => {
      const current = router.currentRoute.value;
      if (current.name === "Login" || current.path === "/login") {
        return;
      }
      const redirect =
        redirectOverride ??
        (current.fullPath && current.fullPath !== "/login" ? current.fullPath : undefined);
      const query =
        redirect && redirect !== "/login" && redirect !== "/" ? { redirect } : {};
      return router.replace({ path: "/login", query });
    })
    .catch(() => {
      /* 兜底：哈希路由下直接改 hash */
      if (typeof window !== "undefined" && !window.location.hash.startsWith("#/login")) {
        window.location.hash = "#/login";
      }
    })
    .finally(() => {
      redirecting = false;
    });
}
