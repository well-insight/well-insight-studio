import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getAppMenus,
  addMenu,
  updateMenu,
  sortMenus,
  removeMenu,
  publishApp,
} from "../controllers/assemblyController";

const router: Router = Router({ mergeParams: true });

router.use(authenticateToken);

router.get("/:id/menus", getAppMenus);
router.post("/:id/menus", addMenu);
router.put("/:id/menus/:menuId", updateMenu);
router.patch("/:id/menus/sort", sortMenus);
router.delete("/:id/menus/:menuId", removeMenu);
router.post("/:id/publish", publishApp);

export default router;
