import { Router } from 'express';
import authorsRouter from './authors.routes.js';
import postsRouter from './posts.routes.js';

const router = Router();

// Un router por recurso: /api/authors y /api/posts.
router.use('/authors', authorsRouter);
router.use('/posts', postsRouter);

export default router;
