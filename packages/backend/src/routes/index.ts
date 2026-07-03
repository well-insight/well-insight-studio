import { Router } from "express";
// import authRoutes from "./auth";
import applicationRoutes from "./applicationRoutes";
import assemblyRoutes from "./assemblyRoutes";
import authRoutes from "./authRoutes";
import connectorRoutes from "./connectorRoutes";
import datasetRoutes from "./datasetRoutes";
import lowcodeRoutes from "./lowcode";
import pageRoutes from "./pageRoutes";
import userRoutes from "./userRoutes";

const router: Router = Router();

// API 版本路由
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/lowcode", lowcodeRoutes);
router.use("/applications", applicationRoutes);
router.use("/applications", assemblyRoutes);
router.use("/pages", pageRoutes);
router.use("/datasets", datasetRoutes);
router.use("/connector", connectorRoutes);

// 根路径
router.get("/", (req, res) => {
  res.json({
    message: "Low Code Platform API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/v1/auth",
      "/api/v1/users",
      "/api/v1/lowcode",
      "/api/v1/applications",
      "/api/v1/pages",
      "/api/v1/datasets",
      "/api/v1/connector",
      "/health",
    ],
  });
});

export default router;
