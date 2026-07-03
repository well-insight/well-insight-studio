import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  createPage,
  listPages,
  getPage,
  updatePage,
  deletePage,
} from "../controllers/pageController";

const router: Router = Router();

router.use(authenticateToken);

router.post("/", createPage);
router.get("/", listPages);
router.get("/:id", getPage);
router.put("/:id", updatePage);
router.delete("/:id", deletePage);

export default router;
