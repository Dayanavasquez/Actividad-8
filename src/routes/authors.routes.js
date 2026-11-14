import { Router } from 'express';
import { getAllAuthors, getAuthorById, getPostsByAuthor, createAuthor, updateAuthor, patchAuthor, removeAuthor } from '../controllers/authors.controller.js';
import {checkAuthorId} from '../middlewares/authors.middleware.js';

const router = Router();

router.get('/', getAllAuthors);
router.post('/', createAuthor);
router.get('/:id/posts', checkAuthorId, getPostsByAuthor);
router.get('/:id', checkAuthorId, getAuthorById);
router.put('/:id', checkAuthorId, updateAuthor);
router.patch('/:id', checkAuthorId, patchAuthor);
router.delete('/:id', checkAuthorId, removeAuthor);

export default router;
