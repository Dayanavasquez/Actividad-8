import { Router } from 'express';
import { getAllPosts, getPostById, createPost, updatePost, patchPost, removePost } from '../controllers/posts.controller.js';
import checkPostId from '../middlewares/posts.middleware.js';

const router = Router();

router.get('/', getAllPosts);
router.post('/', createPost);
router.get('/:id', checkPostId, getPostById);
router.put('/:id', checkPostId, updatePost);
router.patch('/:id', checkPostId, patchPost);
router.delete('/:id', checkPostId, removePost);

export default router;
