import { Router } from "express";
// import authRoutes from "./auth";
import lowcodeRoutes from "./lowcode";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import datasetRoutes from "./datasetRoutes";

const router: Router = Router();

// API 版本路由
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/lowcode", lowcodeRoutes);
router.use("/datasets", datasetRoutes);

// 根路径
router.get("/", (req, res) => {
  res.json({
    message: "Low Code Platform API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: ["/api/v1/auth", "/api/v1/users", "/api/v1/lowcode", "/api/v1/datasets", "/health"],
  });
});

export default router;
