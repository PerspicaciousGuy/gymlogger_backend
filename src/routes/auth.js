const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('password')
      .isString()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

router.get('/me', auth, authController.getMe);

module.exports = router;