import { Router } from 'express';
import * as problemController from '@/controller/problem.controller'

const router = Router();

router.post('/create', problemController.createProblem);
router.get('/getAll', problemController.getProblems);
router.get('/:slug', problemController.getProblemBySlug);
router.put('/:slug', problemController.updateProblem);
router.delete('/:slug', problemController.deleteProblem);

export default router;