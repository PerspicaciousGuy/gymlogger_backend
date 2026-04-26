BEGIN;

INSERT INTO categories (id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Chest', 'Chest-focused pushing movements and variations.'),
  ('00000000-0000-0000-0000-000000000102', 'Back', 'Pulling movements for back thickness and width.'),
  ('00000000-0000-0000-0000-000000000103', 'Legs', 'Lower body strength and hypertrophy exercises.'),
  ('00000000-0000-0000-0000-000000000104', 'Shoulders', 'Deltoid and upper shoulder complex movements.'),
  ('00000000-0000-0000-0000-000000000105', 'Core', 'Trunk stability and abdominal training exercises.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO muscle_groups (id, name, category_id)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'Pectoralis Major', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000202', 'Upper Chest', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000203', 'Latissimus Dorsi', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000204', 'Trapezius', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000205', 'Biceps', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000206', 'Quadriceps', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000207', 'Hamstrings', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000208', 'Glutes', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000209', 'Deltoids', '00000000-0000-0000-0000-000000000104'),
  ('00000000-0000-0000-0000-000000000210', 'Abdominals', '00000000-0000-0000-0000-000000000105')
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercises (
  id,
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
VALUES
  (
    '00000000-0000-0000-0000-000000000301',
    'Barbell Bench Press',
    'Classic horizontal press for chest strength and size.',
    'Lie on a flat bench, lower the bar to mid-chest, and press to full lockout with control.',
    'intermediate',
    ARRAY['barbell', 'bench'],
    'https://example.com/images/barbell-bench-press.jpg',
    'https://example.com/videos/barbell-bench-press.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'Incline Dumbbell Press',
    'Upper chest focused pressing variation.',
    'Set bench to a low incline, lower dumbbells to upper chest, and press up without bouncing.',
    'beginner',
    ARRAY['dumbbells', 'incline bench'],
    'https://example.com/images/incline-dumbbell-press.jpg',
    'https://example.com/videos/incline-dumbbell-press.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'Pull-Up',
    'Bodyweight vertical pull for lats and upper back.',
    'Start from a dead hang, pull elbows down and back until chin passes the bar, then lower slowly.',
    'intermediate',
    ARRAY['pull-up bar'],
    'https://example.com/images/pull-up.jpg',
    'https://example.com/videos/pull-up.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    'Barbell Row',
    'Compound back movement for mid-back and lats.',
    'Hinge at the hips, keep a neutral spine, row the bar toward lower ribs, and pause briefly at the top.',
    'intermediate',
    ARRAY['barbell'],
    'https://example.com/images/barbell-row.jpg',
    'https://example.com/videos/barbell-row.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    'Dumbbell Bicep Curl',
    'Isolation exercise for elbow flexors.',
    'Keep elbows near your torso, curl dumbbells up, squeeze at the top, and lower under control.',
    'beginner',
    ARRAY['dumbbells'],
    'https://example.com/images/dumbbell-bicep-curl.jpg',
    'https://example.com/videos/dumbbell-bicep-curl.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000306',
    'Back Squat',
    'Primary lower body strength exercise.',
    'Set the bar on upper back, brace your core, squat to depth, and drive up through mid-foot.',
    'advanced',
    ARRAY['barbell', 'squat rack'],
    'https://example.com/images/back-squat.jpg',
    'https://example.com/videos/back-squat.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000307',
    'Romanian Deadlift',
    'Hip hinge pattern emphasizing hamstrings and glutes.',
    'Push hips back with slight knee bend, lower bar to mid-shin, then return by driving hips forward.',
    'intermediate',
    ARRAY['barbell'],
    'https://example.com/images/romanian-deadlift.jpg',
    'https://example.com/videos/romanian-deadlift.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000308',
    'Walking Lunge',
    'Unilateral leg movement for balance and strength.',
    'Step forward into a lunge, lower both knees under control, push off the front foot, and alternate legs.',
    'beginner',
    ARRAY['bodyweight', 'dumbbells'],
    'https://example.com/images/walking-lunge.jpg',
    'https://example.com/videos/walking-lunge.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000309',
    'Overhead Press',
    'Vertical pressing movement for shoulder strength.',
    'Press bar from upper chest to overhead lockout, keep ribs down, and avoid excessive back extension.',
    'intermediate',
    ARRAY['barbell'],
    'https://example.com/images/overhead-press.jpg',
    'https://example.com/videos/overhead-press.mp4',
    TRUE,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000310',
    'Plank',
    'Static core stability exercise.',
    'Maintain a straight line from head to heels, brace your core, and hold while breathing steadily.',
    'beginner',
    ARRAY['bodyweight'],
    'https://example.com/images/plank.jpg',
    'https://example.com/videos/plank.mp4',
    TRUE,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', TRUE),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000209', FALSE),

  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', TRUE),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000209', FALSE),

  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000203', TRUE),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000205', FALSE),

  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000203', TRUE),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000204', FALSE),

  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000205', TRUE),

  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000206', TRUE),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000208', FALSE),

  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000207', TRUE),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000208', FALSE),

  ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000206', TRUE),
  ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000208', FALSE),

  ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000209', TRUE),
  ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000204', FALSE),

  ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000210', TRUE)
ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

COMMIT;