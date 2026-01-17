import { Router } from 'express';
import * as problemController from '@/controller/problem.controller'
import { verifyAccessToken } from '@/middlewares/auth.middleware';
import { verifyAdmin } from '@/middlewares/auth.middleware';

const router = Router();

// Protected routes (require access token) -- for admin
router.post('/create',verifyAccessToken,verifyAdmin, problemController.createProblem);
router.put('/:slug', problemController.updateProblem);
router.delete('/:slug', problemController.deleteProblem);


//public routes
router.get('/getAll', problemController.getProblems);
router.get('/:slug', problemController.getProblemBySlug);




export default router;