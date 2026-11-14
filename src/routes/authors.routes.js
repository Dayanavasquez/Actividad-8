import { Router } from 'express';
import { getAllAuthors, getAuthorById, getPostsByAuthor, createAuthor } from '../controllers/authors.controller.js';
import {checkAuthorId,checkAuthorName} from '../middlewares/authors.middleware.js';

const router = Router();

router.get('/', getAllAuthors);
router.post('/', createAuthor);
router.get('/:id/posts', checkAuthorId, getPostsByAuthor);
router.get('/nombre/:name/posts', checkAuthorName, getPostsByAuthor);
router.get('/:id', checkAuthorId, getAuthorById);

export default router;
