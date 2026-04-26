const express = require('express');
const { param } = require('express-validator');

const auth = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.get('/', categoryController.getAllCategories);

router.get('/:id', [param('id').isUUID().withMessage('Category id must be a valid UUID')], categoryController.getCategoryById);

router.post('/', auth, categoryController.createCategory);

router.put('/:id', [auth, param('id').isUUID().withMessage('Category id must be a valid UUID')], categoryController.updateCategory);

router.delete('/:id', [auth, param('id').isUUID().withMessage('Category id must be a valid UUID')], categoryController.deleteCategory);

module.exports = router;