// src/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router: Router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

export default router;
