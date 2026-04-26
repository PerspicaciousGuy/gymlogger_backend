const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const pool = require('../db');

function signToken(user) {
  const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required. Set it in your environment or .env file.');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN || '1d' }
  );
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [normalizedEmail, passwordHash, name.trim()]
    );

    const user = result.rows[0];
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already in use' });
    }

    return res.status(500).json({ message: 'Failed to register user' });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const dbUser = result.rows[0];
    const isMatch = await bcrypt.compare(password, dbUser.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    };

    const token = signToken(user);

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to log in' });
  }
}

function getMe(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  getMe,
};