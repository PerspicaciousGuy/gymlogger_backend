const express = require('express');
const { param } = require('express-validator');

const auth = require('../middleware/auth');
const exerciseController = require('../controllers/exerciseController');

const router = express.Router();

router.get('/', exerciseController.getAllExercises);

router.get('/:id', [param('id').isUUID().withMessage('Exercise id must be a valid UUID')], exerciseController.getExerciseById);

router.post('/', auth, exerciseController.createExercise);

router.put('/:id', [auth, param('id').isUUID().withMessage('Exercise id must be a valid UUID')], exerciseController.updateExercise);

router.delete('/:id', [auth, param('id').isUUID().withMessage('Exercise id must be a valid UUID')], exerciseController.deleteExercise);

module.exports = router;