import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, requireAdmin, UserController.list);
router.post(
  "/:id/reset-password",
  authenticateToken,
  requireAdmin,
  UserController.resetPassword,
);

export default router;
