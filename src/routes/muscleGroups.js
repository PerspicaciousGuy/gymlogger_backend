const express = require('express');
const { param } = require('express-validator');

const auth = require('../middleware/auth');
const muscleGroupController = require('../controllers/muscleGroupController');

const router = express.Router();

router.get('/', muscleGroupController.getAllMuscleGroups);

router.get('/:id', [param('id').isUUID().withMessage('Muscle group id must be a valid UUID')], muscleGroupController.getMuscleGroupById);

router.post('/', auth, muscleGroupController.createMuscleGroup);

router.put('/:id', [auth, param('id').isUUID().withMessage('Muscle group id must be a valid UUID')], muscleGroupController.updateMuscleGroup);

router.delete('/:id', [auth, param('id').isUUID().withMessage('Muscle group id must be a valid UUID')], muscleGroupController.deleteMuscleGroup);

module.exports = router;