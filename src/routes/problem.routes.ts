import { Router } from 'express';
import {
  createProblem,
  getProblems,
  getProblemBySlug,
  updateProblem,
  deleteProblem,
} from '../controller/problem.controller';

const router = Router();

router.post('/create', createProblem);
router.get('/getAll', getProblems);
router.get('/:slug', getProblemBySlug);
router.put('/:slug', updateProblem);
router.delete('/:slug', deleteProblem);

export default router;