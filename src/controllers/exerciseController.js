const { validationResult } = require('express-validator');

const pool = require('../db');

const ALLOWED_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function isUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeEquipmentFilter(value) {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : [value];
  const normalized = rawValues
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(normalized)];
}

function normalizeEquipmentInput(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw badRequest('equipment must be an array of strings');
  }

  const normalized = value.map((item) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw badRequest('equipment must contain non-empty strings');
    }

    return item.trim();
  });

  return normalized;
}

function normalizeMuscleGroups(value) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw badRequest('muscle_groups must be a non-empty array');
  }

  const byId = new Map();

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw badRequest('Each muscle_groups item must be an object with id and optional is_primary');
    }

    const id = typeof item.id === 'string' ? item.id.trim() : '';
    if (!isUuid(id)) {
      throw badRequest('Each muscle_groups item must include a valid UUID id');
    }

    const isPrimary = item.is_primary === true;

    if (byId.has(id)) {
      byId.set(id, byId.get(id) || isPrimary);
    } else {
      byId.set(id, isPrimary);
    }
  }

  return [...byId.entries()].map(([id, is_primary]) => ({ id, is_primary }));
}

function getValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }

  return false;
}

function handleControllerError(res, error, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error.code === '22P02') {
    return res.status(400).json({ message: 'Invalid identifier format' });
  }

  return res.status(500).json({ message: fallbackMessage });
}

function buildExerciseWhereClause(query) {
  const clauses = [];
  const values = [];

  if (typeof query.search === 'string' && query.search.trim()) {
    const search = `%${query.search.trim().toLowerCase()}%`;
    values.push(search);
    const param = `$${values.length}`;
    clauses.push(`(LOWER(e.name) LIKE ${param} OR LOWER(COALESCE(e.description, '')) LIKE ${param})`);
  }

  if (typeof query.category_id === 'string' && query.category_id.trim()) {
    const categoryId = query.category_id.trim();
    if (!isUuid(categoryId)) {
      throw badRequest('category_id must be a valid UUID');
    }

    values.push(categoryId);
    clauses.push(
      `EXISTS (
        SELECT 1
        FROM exercise_muscle_groups emgf
        JOIN muscle_groups mgf ON mgf.id = emgf.muscle_group_id
        WHERE emgf.exercise_id = e.id
          AND mgf.category_id = $${values.length}
      )`
    );
  }

  if (typeof query.muscle_group_id === 'string' && query.muscle_group_id.trim()) {
    const muscleGroupId = query.muscle_group_id.trim();
    if (!isUuid(muscleGroupId)) {
      throw badRequest('muscle_group_id must be a valid UUID');
    }

    values.push(muscleGroupId);
    clauses.push(
      `EXISTS (
        SELECT 1
        FROM exercise_muscle_groups emgf
        WHERE emgf.exercise_id = e.id
          AND emgf.muscle_group_id = $${values.length}
      )`
    );
  }

  if (typeof query.difficulty === 'string' && query.difficulty.trim()) {
    const difficulty = query.difficulty.trim().toLowerCase();
    if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
      throw badRequest('difficulty must be beginner, intermediate, or advanced');
    }

    values.push(difficulty);
    clauses.push(`e.difficulty = $${values.length}`);
  }

  const equipmentList = normalizeEquipmentFilter(query.equipment);
  if (equipmentList.length > 0) {
    values.push(equipmentList);
    clauses.push(`e.equipment && $${values.length}::text[]`);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

async function assertMuscleGroupsExist(client, muscleGroupIds) {
  if (muscleGroupIds.length === 0) {
    return;
  }

  const result = await client.query('SELECT id FROM muscle_groups WHERE id = ANY($1::uuid[])', [muscleGroupIds]);

  if (result.rows.length !== muscleGroupIds.length) {
    throw badRequest('One or more muscle group IDs are invalid');
  }
}

async function syncExerciseMuscleGroups(client, exerciseId, normalizedMuscleGroups) {
  await client.query('DELETE FROM exercise_muscle_groups WHERE exercise_id = $1', [exerciseId]);

  if (!normalizedMuscleGroups || normalizedMuscleGroups.length === 0) {
    return;
  }

  await client.query(
    `INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary)
     SELECT $1::uuid, x.muscle_group_id::uuid, x.is_primary::boolean
     FROM unnest($2::uuid[], $3::boolean[]) AS x(muscle_group_id, is_primary)`,
    [
      exerciseId,
      normalizedMuscleGroups.map((item) => item.id),
      normalizedMuscleGroups.map((item) => item.is_primary),
    ]
  );
}

async function fetchExerciseById(dbClient, exerciseId) {
  const result = await dbClient.query(
    `SELECT
      e.id,
      e.name,
      e.description,
      e.instructions,
      e.difficulty,
      e.equipment,
      e.image_url,
      e.video_url,
      e.is_public,
      e.created_by,
      e.created_at,
      e.updated_at,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', mg.id,
            'name', mg.name,
            'is_primary', emg.is_primary,
            'category', jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'description', c.description
            )
          )
          ORDER BY emg.is_primary DESC, mg.name ASC
        ) FILTER (WHERE mg.id IS NOT NULL),
        '[]'::jsonb
      ) AS muscle_groups
    FROM exercises e
    LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
    LEFT JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
    LEFT JOIN categories c ON c.id = mg.category_id
    WHERE e.id = $1
    GROUP BY
      e.id,
      e.name,
      e.description,
      e.instructions,
      e.difficulty,
      e.equipment,
      e.image_url,
      e.video_url,
      e.is_public,
      e.created_by,
      e.created_at,
      e.updated_at`,
    [exerciseId]
  );

  return result.rows[0] || null;
}

async function getAllExercises(req, res) {
  try {
    const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
    const requestedLimit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const { whereSql, values } = buildExerciseWhereClause(req.query);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM exercises e
       ${whereSql}`,
      values
    );

    const total = countResult.rows[0]?.total || 0;
    const limitParam = `$${values.length + 1}`;
    const offsetParam = `$${values.length + 2}`;

    const exercisesResult = await pool.query(
      `SELECT
        e.id,
        e.name,
        e.description,
        e.instructions,
        e.difficulty,
        e.equipment,
        e.image_url,
        e.video_url,
        e.is_public,
        e.created_by,
        e.created_at,
        e.updated_at,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', mg.id,
              'name', mg.name,
              'is_primary', emg.is_primary,
              'category', jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'description', c.description
              )
            )
            ORDER BY emg.is_primary DESC, mg.name ASC
          ) FILTER (WHERE mg.id IS NOT NULL),
          '[]'::jsonb
        ) AS muscle_groups
      FROM exercises e
      LEFT JOIN exercise_muscle_groups emg ON emg.exercise_id = e.id
      LEFT JOIN muscle_groups mg ON mg.id = emg.muscle_group_id
      LEFT JOIN categories c ON c.id = mg.category_id
      ${whereSql}
      GROUP BY
        e.id,
        e.name,
        e.description,
        e.instructions,
        e.difficulty,
        e.equipment,
        e.image_url,
        e.video_url,
        e.is_public,
        e.created_by,
        e.created_at,
        e.updated_at
      ORDER BY e.created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}`,
      [...values, limit, offset]
    );

    return res.json({
      data: exercisesResult.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch exercises');
  }
}

async function getExerciseById(req, res) {
  if (getValidationErrors(req, res)) {
    return undefined;
  }

  try {
    const exercise = await fetchExerciseById(pool, req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    return res.json({ data: exercise });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch exercise');
  }
}

async function createExercise(req, res) {
  if (getValidationErrors(req, res)) {
    return undefined;
  }

  const { name, description, instructions, difficulty, equipment, image_url, video_url, is_public } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  if (typeof difficulty !== 'string' || !ALLOWED_DIFFICULTIES.has(difficulty)) {
    return res.status(400).json({ message: 'difficulty must be beginner, intermediate, or advanced' });
  }

  let normalizedMuscleGroups;
  let normalizedEquipment;

  try {
    normalizedMuscleGroups = normalizeMuscleGroups(req.body.muscle_groups);
    if (!normalizedMuscleGroups) {
      throw badRequest('muscle_groups is required');
    }

    normalizedEquipment = normalizeEquipmentInput(equipment);
  } catch (error) {
    return handleControllerError(res, error, 'Invalid exercise data');
  }

  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query('BEGIN');
    transactionOpen = true;

    await assertMuscleGroupsExist(
      client,
      normalizedMuscleGroups.map((item) => item.id)
    );

    const insertResult = await client.query(
      `INSERT INTO exercises (
        name,
        description,
        instructions,
        difficulty,
        equipment,
        image_url,
        video_url,
        is_public,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        name.trim(),
        typeof description === 'string' ? description.trim() : null,
        typeof instructions === 'string' ? instructions.trim() : null,
        difficulty,
        normalizedEquipment === undefined ? null : normalizedEquipment,
        typeof image_url === 'string' ? image_url.trim() : null,
        typeof video_url === 'string' ? video_url.trim() : null,
        typeof is_public === 'boolean' ? is_public : true,
        req.user.id,
      ]
    );

    const exerciseId = insertResult.rows[0].id;

    await syncExerciseMuscleGroups(client, exerciseId, normalizedMuscleGroups);

    await client.query('COMMIT');
    transactionOpen = false;

    const exercise = await fetchExerciseById(pool, exerciseId);
    return res.status(201).json({ data: exercise });
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK');
    }

    return handleControllerError(res, error, 'Failed to create exercise');
  } finally {
    client.release();
  }
}

async function updateExercise(req, res) {
  if (getValidationErrors(req, res)) {
    return undefined;
  }

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const exerciseId = req.params.id;
  const allowedKeys = [
    'name',
    'description',
    'instructions',
    'difficulty',
    'equipment',
    'image_url',
    'video_url',
    'is_public',
    'muscle_groups',
  ];

  const providedAllowedKeys = allowedKeys.filter((key) => Object.prototype.hasOwnProperty.call(req.body, key));
  if (providedAllowedKeys.length === 0) {
    return res.status(400).json({ message: 'No valid fields provided for update' });
  }

  let normalizedMuscleGroups;
  let normalizedEquipment;

  try {
    normalizedMuscleGroups = normalizeMuscleGroups(req.body.muscle_groups);
    normalizedEquipment = normalizeEquipmentInput(req.body.equipment);
  } catch (error) {
    return handleControllerError(res, error, 'Invalid exercise data');
  }

  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query('BEGIN');
    transactionOpen = true;

    const existingResult = await client.query('SELECT created_by FROM exercises WHERE id = $1 FOR UPDATE', [
      exerciseId,
    ]);

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return res.status(404).json({ message: 'Exercise not found' });
    }

    if (existingResult.rows[0].created_by !== req.user.id) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return res.status(403).json({ message: 'You can only modify your own exercises' });
    }

    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
        throw badRequest('name must be a non-empty string');
      }

      values.push(req.body.name.trim());
      updates.push(`name = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      values.push(typeof req.body.description === 'string' ? req.body.description.trim() : null);
      updates.push(`description = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'instructions')) {
      values.push(typeof req.body.instructions === 'string' ? req.body.instructions.trim() : null);
      updates.push(`instructions = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'difficulty')) {
      const difficulty = req.body.difficulty;
      if (typeof difficulty !== 'string' || !ALLOWED_DIFFICULTIES.has(difficulty)) {
        throw badRequest('difficulty must be beginner, intermediate, or advanced');
      }

      values.push(difficulty);
      updates.push(`difficulty = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'equipment')) {
      values.push(normalizedEquipment);
      updates.push(`equipment = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'image_url')) {
      values.push(typeof req.body.image_url === 'string' ? req.body.image_url.trim() : null);
      updates.push(`image_url = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'video_url')) {
      values.push(typeof req.body.video_url === 'string' ? req.body.video_url.trim() : null);
      updates.push(`video_url = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'is_public')) {
      if (typeof req.body.is_public !== 'boolean') {
        throw badRequest('is_public must be a boolean');
      }

      values.push(req.body.is_public);
      updates.push(`is_public = $${values.length}`);
    }

    if (updates.length > 0) {
      values.push(exerciseId);
      await client.query(`UPDATE exercises SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    }

    if (normalizedMuscleGroups) {
      await assertMuscleGroupsExist(
        client,
        normalizedMuscleGroups.map((item) => item.id)
      );
      await syncExerciseMuscleGroups(client, exerciseId, normalizedMuscleGroups);
    }

    await client.query('COMMIT');
    transactionOpen = false;

    const exercise = await fetchExerciseById(pool, exerciseId);
    return res.json({ data: exercise });
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK');
    }

    return handleControllerError(res, error, 'Failed to update exercise');
  } finally {
    client.release();
  }
}

async function deleteExercise(req, res) {
  if (getValidationErrors(req, res)) {
    return undefined;
  }

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const exerciseId = req.params.id;
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query('BEGIN');
    transactionOpen = true;

    const existingResult = await client.query('SELECT created_by FROM exercises WHERE id = $1 FOR UPDATE', [
      exerciseId,
    ]);

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return res.status(404).json({ message: 'Exercise not found' });
    }

    if (existingResult.rows[0].created_by !== req.user.id) {
      await client.query('ROLLBACK');
      transactionOpen = false;
      return res.status(403).json({ message: 'You can only delete your own exercises' });
    }

    await client.query('DELETE FROM exercises WHERE id = $1', [exerciseId]);

    await client.query('COMMIT');
    transactionOpen = false;

    return res.status(204).send();
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK');
    }

    return handleControllerError(res, error, 'Failed to delete exercise');
  } finally {
    client.release();
  }
}

module.exports = {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};