import { Router } from 'express';
import { getAllPosts, getPostById, createPost } from '../controllers/posts.controller.js';
import checkPostId from '../middlewares/posts.middleware.js';

const router = Router();

router.get('/', getAllPosts);
router.post('/', createPost);
router.get('/:id', checkPostId, getPostById);

export default router;
