# Exercise Library API

Production-ready Node.js + Express REST API for managing exercises, categories, muscle groups, and user-authored content with JWT authentication.

## Project Overview

This API provides:

- JWT auth with register/login/me endpoints
- Exercise CRUD with ownership checks
- Category and muscle group management
- Search + filtering + pagination for exercises
- PostgreSQL schema and seed SQL files
- Auth route rate limiting
- Health endpoint
- Global 404 and error handlers

## Tech Stack

- Node.js + Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Validation (`express-validator`)
- Security middleware (`helmet`, `cors`)
- Rate limiting (`express-rate-limit`)

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Update `.env` values:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

4. Create database schema:

```bash
psql -U <your_user> -d <your_db> -f src/db/schema.sql
```

5. Seed database:

```bash
psql -U <your_user> -d <your_db> -f src/db/seed.sql
```

6. Run server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start server with node

## API Conventions

- Base URL: `http://localhost:3000`
- Auth header: `Authorization: Bearer <token>`
- Protected routes require JWT
- Auth routes are rate-limited to 20 requests per 15 minutes per IP

## Health Endpoint

### GET /api/health

- Auth required: No
- Query params: None
- Body: None

Example request:

```bash
curl http://localhost:3000/api/health
```

Example response:

```json
{
   "status": "ok",
   "uptime": 125.8432,
   "timestamp": "2026-04-26T10:42:30.121Z"
}
```

## Auth Endpoints

### POST /api/auth/register

- Auth required: No
- Body params:
   - `email` (string, required)
   - `password` (string, required, min 8 chars)
   - `name` (string, required)

Example request:

```bash
curl -X POST http://localhost:3000/api/auth/register \
   -H "Content-Type: application/json" \
   -d '{
      "email": "john@example.com",
      "password": "StrongPass123",
      "name": "John Doe"
   }'
```

Example response:

```json
{
   "token": "<jwt>",
   "user": {
      "id": "fca0d39f-4698-40fa-b4f7-bf45526a2eb6",
      "email": "john@example.com",
      "name": "John Doe",
      "created_at": "2026-04-26T10:45:00.000Z"
   }
}
```

### POST /api/auth/login

- Auth required: No
- Body params:
   - `email` (string, required)
   - `password` (string, required)

Example request:

```bash
curl -X POST http://localhost:3000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{
      "email": "john@example.com",
      "password": "StrongPass123"
   }'
```

Example response:

```json
{
   "token": "<jwt>",
   "user": {
      "id": "fca0d39f-4698-40fa-b4f7-bf45526a2eb6",
      "email": "john@example.com",
      "name": "John Doe"
   }
}
```

### GET /api/auth/me

- Auth required: Yes
- Body params: None
- Query params: None

Example request:

```bash
curl http://localhost:3000/api/auth/me \
   -H "Authorization: Bearer <jwt>"
```

Example response:

```json
{
   "user": {
      "id": "fca0d39f-4698-40fa-b4f7-bf45526a2eb6",
      "email": "john@example.com",
      "name": "John Doe",
      "iat": 1714123000,
      "exp": 1714209400
   }
}
```

## Exercise Endpoints

### GET /api/exercises

- Auth required: No
- Query params:
   - `search` (optional)
   - `category_id` (optional UUID)
   - `muscle_group_id` (optional UUID)
   - `difficulty` (optional: beginner|intermediate|advanced)
   - `equipment` (optional, comma-separated or repeated)
   - `page` (optional, default 1)
   - `limit` (optional, default 10, max 100)

Example request:

```bash
curl "http://localhost:3000/api/exercises?search=press&difficulty=beginner&page=1&limit=5"
```

Example response:

```json
{
   "data": [
      {
         "id": "00000000-0000-0000-0000-000000000302",
         "name": "Incline Dumbbell Press",
         "description": "Upper chest focused pressing variation.",
         "difficulty": "beginner",
         "equipment": ["dumbbells", "incline bench"],
         "muscle_groups": []
      }
   ],
   "pagination": {
      "total": 1,
      "page": 1,
      "limit": 5,
      "total_pages": 1
   }
}
```

### GET /api/exercises/:id

- Auth required: No
- Path params:
   - `id` (UUID)

Example request:

```bash
curl http://localhost:3000/api/exercises/00000000-0000-0000-0000-000000000301
```

Example response:

```json
{
   "data": {
      "id": "00000000-0000-0000-0000-000000000301",
      "name": "Barbell Bench Press",
      "difficulty": "intermediate",
      "muscle_groups": [
         {
            "id": "00000000-0000-0000-0000-000000000201",
            "name": "Pectoralis Major",
            "is_primary": true,
            "category": {
               "id": "00000000-0000-0000-0000-000000000101",
               "name": "Chest",
               "description": "Chest-focused pushing movements and variations."
            }
         }
      ]
   }
}
```

### POST /api/exercises

- Auth required: Yes
- Body params:
   - `name` (string, required)
   - `difficulty` (required)
   - `description` (optional)
   - `instructions` (optional)
   - `equipment` (optional string[])
   - `image_url` (optional)
   - `video_url` (optional)
   - `is_public` (optional boolean)
   - `muscle_groups` (required array): `{ id, is_primary }`

Example request:

```bash
curl -X POST http://localhost:3000/api/exercises \
   -H "Authorization: Bearer <jwt>" \
   -H "Content-Type: application/json" \
   -d '{
      "name": "Cable Fly",
      "description": "Chest isolation movement",
      "instructions": "Keep elbows soft and squeeze chest at center.",
      "difficulty": "beginner",
      "equipment": ["cable machine"],
      "is_public": true,
      "muscle_groups": [
         { "id": "00000000-0000-0000-0000-000000000201", "is_primary": true }
      ]
   }'
```

Example response:

```json
{
   "data": {
      "id": "5fed043b-1a56-4e63-bce2-8fd0a59ae20d",
      "name": "Cable Fly",
      "created_by": "fca0d39f-4698-40fa-b4f7-bf45526a2eb6",
      "muscle_groups": [
         {
            "id": "00000000-0000-0000-0000-000000000201",
            "name": "Pectoralis Major",
            "is_primary": true
         }
      ]
   }
}
```

### PUT /api/exercises/:id

- Auth required: Yes (must be creator)
- Path params:
   - `id` (UUID)
- Body params: any subset of create fields

Example request:

```bash
curl -X PUT http://localhost:3000/api/exercises/5fed043b-1a56-4e63-bce2-8fd0a59ae20d \
   -H "Authorization: Bearer <jwt>" \
   -H "Content-Type: application/json" \
   -d '{
      "name": "Cable Chest Fly",
      "difficulty": "intermediate",
      "muscle_groups": [
         { "id": "00000000-0000-0000-0000-000000000201", "is_primary": true },
         { "id": "00000000-0000-0000-0000-000000000209", "is_primary": false }
      ]
   }'
```

Example response:

```json
{
   "data": {
      "id": "5fed043b-1a56-4e63-bce2-8fd0a59ae20d",
      "name": "Cable Chest Fly",
      "difficulty": "intermediate"
   }
}
```

### DELETE /api/exercises/:id

- Auth required: Yes (must be creator)
- Path params:
   - `id` (UUID)

Example request:

```bash
curl -X DELETE http://localhost:3000/api/exercises/5fed043b-1a56-4e63-bce2-8fd0a59ae20d \
   -H "Authorization: Bearer <jwt>"
```

Example response:

```http
204 No Content
```

## Category Endpoints

### GET /api/categories

- Auth required: No
- Query params: None

Example request:

```bash
curl http://localhost:3000/api/categories
```

Example response:

```json
{
   "data": [
      {
         "id": "00000000-0000-0000-0000-000000000101",
         "name": "Chest",
         "description": "Chest-focused pushing movements and variations.",
         "muscle_groups": [
            {
               "id": "00000000-0000-0000-0000-000000000201",
               "name": "Pectoralis Major"
            }
         ]
      }
   ]
}
```

### GET /api/categories/:id

- Auth required: No
- Path params:
   - `id` (UUID)

Example request:

```bash
curl http://localhost:3000/api/categories/00000000-0000-0000-0000-000000000101
```

Example response:

```json
{
   "data": {
      "id": "00000000-0000-0000-0000-000000000101",
      "name": "Chest",
      "muscle_groups": [
         {
            "id": "00000000-0000-0000-0000-000000000201",
            "name": "Pectoralis Major"
         }
      ]
   }
}
```

### POST /api/categories

- Auth required: Yes
- Body params:
   - `name` (string, required)
   - `description` (string, optional)

Example request:

```bash
curl -X POST http://localhost:3000/api/categories \
   -H "Authorization: Bearer <jwt>" \
   -H "Content-Type: application/json" \
   -d '{ "name": "Arms", "description": "Arm-focused muscles" }'
```

Example response:

```json
{
   "data": {
      "id": "1d0f8f1a-3700-4bce-9f60-9a7d1ce203ca",
      "name": "Arms",
      "description": "Arm-focused muscles",
      "muscle_groups": []
   }
}
```

### PUT /api/categories/:id

- Auth required: Yes
- Path params:
   - `id` (UUID)
- Body params:
   - `name` (optional)
   - `description` (optional)

Example request:

```bash
curl -X PUT http://localhost:3000/api/categories/1d0f8f1a-3700-4bce-9f60-9a7d1ce203ca \
   -H "Authorization: Bearer <jwt>" \
   -H "Content-Type: application/json" \
   -d '{ "description": "Arms and forearms" }'
```

Example response:

```json
{
   "data": {
      "id": "1d0f8f1a-3700-4bce-9f60-9a7d1ce203ca",
      "name": "Arms",
      "description": "Arms and forearms",
      "muscle_groups": []
   }
}
```

### DELETE /api/categories/:id

- Auth required: Yes
- Path params:
   - `id` (UUID)

Example request:

```bash
curl -X DELETE http://localhost:3000/api/categories/1d0f8f1a-3700-4bce-9f60-9a7d1ce203ca \
   -H "Authorization: Bearer <jwt>"
```

Example response:

```http
204 No Content
```

## Muscle Group Endpoints

### GET /api/muscle-groups

- Auth required: No
- Query params:
   - `category_id` (optional UUID)

Example request:

```bash
curl "http://localhost:3000/api/muscle-groups?category_id=00000000-0000-0000-0000-000000000101"
```

Example response:

```json
{
   "data": [
      {
         "id": "00000000-0000-0000-0000-000000000201",
         "name": "Pectoralis Major",
         "category_id": "00000000-0000-0000-0000-000000000101",
         "category": {
            "id": "00000000-0000-0000-0000-000000000101",
            "name": "Chest",
            "description": "Chest-focused pushing movements and variations."
         }
      }
   ]
}
```

### GET /api/muscle-groups/:id

- Auth required: No
- Path params:
   - `id` (UUID)

Example request:

```bash
curl http://localhost:3000/api/muscle-groups/00000000-0000-0000-0000-000000000201
```

Example response:

```json
{
   "data": {
      "id": "00000000-0000-0000-0000-000000000201",
      "name": "Pectoralis Major",
      "category_id": "00000000-0000-0000-0000-000000000101",
      "category": {
         "id": "00000000-0000-0000-0000-000000000101",
         "name": "Chest",
         "description": "Chest-focused pushing movements and variations."
      }
   }
}
```

### POST /api/muscle-groups

- Auth required: Yes
- Body params:
   - `name` (string, required)
   - `category_id` (UUID, required)

Example request:

```bash
curl -X POST http://localhost:3000/api/muscle-groups \
   -H "Authorization: Bearer <jwt>" \
   -H "Content-Type: application/json" \
   -d '{
      "name": "Triceps",
      "category_id": "00000000-0000-0000-0000-000000000104"
   }'
```

Example response:

```json
{
   "data": {
      "id": "b8f092cf-6038-4f3b-aaec-d18f8fdf6d26",
      "name": "Triceps",
      "category_id": "00000000-0000-0000-0000-000000000104",
      "category": {
         "id": "00000000-0000-0000-0000-000000000104",
         "name": "Shoulders",
         "description": "Deltoid and upper shoulder complex movements."
      }
   }
}
```

### PUT /api/muscle-groups/:id

- Auth required: Yes
- Path params:
   - `id` (UUID)
- Body params:
   - `name` (optional)
   - `category_id` (optional UUID)

Example request:

```bash
curl -X PUT http://localhost:3000/api/muscle-groups/b8f092cf-6038-4f3b-aaec-d18f8fdf6d26 \
   -H "Authorization: Bearer <jwt>" \
   -H "Content-Type: application/json" \
   -d '{ "name": "Long Head Triceps" }'
```

Example response:

```json
{
   "data": {
      "id": "b8f092cf-6038-4f3b-aaec-d18f8fdf6d26",
      "name": "Long Head Triceps",
      "category_id": "00000000-0000-0000-0000-000000000104"
   }
}
```

### DELETE /api/muscle-groups/:id

- Auth required: Yes
- Path params:
   - `id` (UUID)

Example request:

```bash
curl -X DELETE http://localhost:3000/api/muscle-groups/b8f092cf-6038-4f3b-aaec-d18f8fdf6d26 \
   -H "Authorization: Bearer <jwt>"
```

Example response:

```http
204 No Content
```

## Error Response Format

Global middleware returns consistent JSON for unhandled errors:

```json
{
   "success": false,
   "message": "Human-readable error message",
   "errors": []
}
```

In production mode (`NODE_ENV=production`), stack traces are never returned.