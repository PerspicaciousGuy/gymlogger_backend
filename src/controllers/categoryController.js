const { validationResult } = require('express-validator');

const pool = require('../db');

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
    return res.status(409).json({ message: 'Category name already exists' });
  }

  if (error.code === '23503') {
    return res.status(409).json({ message: 'Category cannot be deleted because it is in use' });
  }

  return res.status(500).json({ message: fallbackMessage });
}

async function getAllCategories(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.created_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', mg.id,
              'name', mg.name,
              'created_at', mg.created_at
            )
            ORDER BY mg.name ASC
          ) FILTER (WHERE mg.id IS NOT NULL),
          '[]'::jsonb
        ) AS muscle_groups
      FROM categories c
      LEFT JOIN muscle_groups mg ON mg.category_id = c.id
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.name ASC`
    );

    return res.json({ data: result.rows });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch categories');
  }
}

async function getCategoryById(req, res) {
  if (hasValidationErrors(req, res)) {
    return undefined;
  }

  try {
    const result = await pool.query(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.created_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', mg.id,
              'name', mg.name,
              'created_at', mg.created_at
            )
            ORDER BY mg.name ASC
          ) FILTER (WHERE mg.id IS NOT NULL),
          '[]'::jsonb
        ) AS muscle_groups
      FROM categories c
      LEFT JOIN muscle_groups mg ON mg.category_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.created_at`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.json({ data: result.rows[0] });
  } catch (error) {
    return handleError(res, error, 'Failed to fetch category');
  }
}

async function createCategory(req, res) {
  const { name, description } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at`,
      [name.trim(), typeof description === 'string' ? description.trim() : null]
    );

    return res.status(201).json({ data: { ...result.rows[0], muscle_groups: [] } });
  } catch (error) {
    return handleError(res, error, 'Failed to create category');
  }
}

async function updateCategory(req, res) {
  if (hasValidationErrors(req, res)) {
    return undefined;
  }

  const allowedKeys = ['name', 'description'];
  const providedKeys = allowedKeys.filter((key) => Object.prototype.hasOwnProperty.call(req.body, key));

  if (providedKeys.length === 0) {
    return res.status(400).json({ message: 'No valid fields provided for update' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ message: 'name must be a non-empty string' });
    }
  }

  try {
    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      values.push(req.body.name.trim());
      updates.push(`name = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      values.push(typeof req.body.description === 'string' ? req.body.description.trim() : null);
      updates.push(`description = $${values.length}`);
    }

    values.push(req.params.id);

    const updateResult = await pool.query(
      `UPDATE categories
       SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING id`,
      values
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const categoryResult = await pool.query(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.created_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', mg.id,
              'name', mg.name,
              'created_at', mg.created_at
            )
            ORDER BY mg.name ASC
          ) FILTER (WHERE mg.id IS NOT NULL),
          '[]'::jsonb
        ) AS muscle_groups
      FROM categories c
      LEFT JOIN muscle_groups mg ON mg.category_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.created_at`,
      [req.params.id]
    );

    return res.json({ data: categoryResult.rows[0] });
  } catch (error) {
    return handleError(res, error, 'Failed to update category');
  }
}

async function deleteCategory(req, res) {
  if (hasValidationErrors(req, res)) {
    return undefined;
  }

  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return handleError(res, error, 'Failed to delete category');
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};