const { validationResult } = require('express-validator');

const pool = require('../db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }

  return false;
}

function handleError(res, error, fallbackMessage) {
  if (error.code === '22P02') {
    return res.status(400).json({ message: 'Invalid identifier format' });
  }

  if (error.code === '23505') {
    return res.status(409).json({ message: 'Muscle group name already exists' });
  }

  if (error.code === '23503') {
    return res.status(400).json({ message: 'Invalid category_id or muscle group is in use' });
  }

  return res.status(500).json({ message: fallbackMessage });
}

function isUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

async function getAllMuscleGroups(req, res) {
  const { category_id } = req.query;

  if (typeof category_id !== 'undefined' && !isUuid(category_id)) {
    return res.status(400).json({ message: 'category_id must be a valid UUID' });
  }

  try {
    const values = [];
    let whereClause = '';

    if (category_id) {
      values.push(category_id);
      whereClause = `WHERE mg.category_id = $${values.length}`;
    }

    const result = await pool.query(
      `SELECT
        mg.id,
        mg.name,
        mg.category_id,
        mg.created_at,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description
        ) AS category
      FROM muscle_groups mg
      JOIN categories c ON c.id = mg.category_id
      ${whereClause}
      ORDER BY mg.name ASC`,
      values
    );

    return res.json({ data: result.rows });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch muscle groups');
  }
}

async function getMuscleGroupById(req, res) {
  if (hasValidationErrors(req, res)) {
    return undefined;
  }

  try {
    const result = await pool.query(
      `SELECT
        mg.id,
        mg.name,
        mg.category_id,
        mg.created_at,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description
        ) AS category
      FROM muscle_groups mg
      JOIN categories c ON c.id = mg.category_id
      WHERE mg.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Muscle group not found' });
    }

    return res.json({ data: result.rows[0] });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch muscle group');
  }
}

async function createMuscleGroup(req, res) {
  const { name, category_id } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  if (!isUuid(category_id)) {
    return res.status(400).json({ message: 'category_id must be a valid UUID' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO muscle_groups (name, category_id)
       VALUES ($1, $2)
       RETURNING id, name, category_id, created_at`,
      [name.trim(), category_id]
    );

    const muscleGroupId = result.rows[0].id;

    const fullResult = await pool.query(
      `SELECT
        mg.id,
        mg.name,
        mg.category_id,
        mg.created_at,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description
        ) AS category
      FROM muscle_groups mg
      JOIN categories c ON c.id = mg.category_id
      WHERE mg.id = $1`,
      [muscleGroupId]
    );

    return res.status(201).json({ data: fullResult.rows[0] });
  } catch (error) {
    return handleError(res, error, 'Failed to create muscle group');
  }
}

async function updateMuscleGroup(req, res) {
  if (hasValidationErrors(req, res)) {
    return undefined;
  }

  const allowedKeys = ['name', 'category_id'];
  const providedKeys = allowedKeys.filter((key) => Object.prototype.hasOwnProperty.call(req.body, key));

  if (providedKeys.length === 0) {
    return res.status(400).json({ message: 'No valid fields provided for update' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ message: 'name must be a non-empty string' });
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'category_id')) {
    if (!isUuid(req.body.category_id)) {
      return res.status(400).json({ message: 'category_id must be a valid UUID' });
    }
  }

  try {
    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      values.push(req.body.name.trim());
      updates.push(`name = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'category_id')) {
      values.push(req.body.category_id);
      updates.push(`category_id = $${values.length}`);
    }

    values.push(req.params.id);

    const updateResult = await pool.query(
      `UPDATE muscle_groups
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING id`,
      values
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Muscle group not found' });
    }

    const fullResult = await pool.query(
      `SELECT
        mg.id,
        mg.name,
        mg.category_id,
        mg.created_at,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description
        ) AS category
      FROM muscle_groups mg
      JOIN categories c ON c.id = mg.category_id
      WHERE mg.id = $1`,
      [req.params.id]
    );

    return res.json({ data: fullResult.rows[0] });
  } catch (error) {
    return handleError(res, error, 'Failed to update muscle group');
  }
}

async function deleteMuscleGroup(req, res) {
  if (hasValidationErrors(req, res)) {
    return undefined;
  }

  try {
    const result = await pool.query('DELETE FROM muscle_groups WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Muscle group not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return handleError(res, error, 'Failed to delete muscle group');
  }
}

module.exports = {
  getAllMuscleGroups,
  getMuscleGroupById,
  createMuscleGroup,
  updateMuscleGroup,
  deleteMuscleGroup,
};