# Flutter integration notes

- Base API by platform:
  - Android emulator: `http://10.0.2.2:8000`
  - iOS simulator: `http://127.0.0.1:8000`
  - Physical device: `http://<your-computer-lan-ip>:8000`

- Endpoints:
  - `GET /exercises` — list; supports query params `limit`, `offset`, `tag`, `equipment`, `search`
  - `GET /exercises/{slug}` — get exercise by slug

Quick tips for Flutter apps:

- For mobile apps (iOS/Android) you can use the `http` or `dio` packages to fetch JSON.
- For Flutter web, CORS is required — the API already includes permissive CORS for development (adjust in production).
- Use pagination (`limit`/`offset`) to avoid loading the full library at once.

Example (using `http` package):

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

final base = 'http://127.0.0.1:8000';

Future<List<dynamic>> fetchExercises({int limit = 20, int offset = 0}) async {
  final uri = Uri.parse('$base/exercises?limit=$limit&offset=$offset');
  final res = await http.get(uri);
  if (res.statusCode != 200) throw Exception('API error');
  final body = json.decode(res.body) as Map<String, dynamic>;
  return body['items'] as List<dynamic>;
}

Future<Map<String, dynamic>> fetchExerciseBySlug(String slug) async {
  final uri = Uri.parse('$base/exercises/$slug');
  final res = await http.get(uri);
  if (res.statusCode != 200) throw Exception('Not found');
  return json.decode(res.body) as Map<String, dynamic>;
}
```

Modeling notes:
- Map the JSON fields (name, slug, tags, instructions, etc.) to Dart models using `fromJson`/`toJson`.
- For lists stored as JSON (e.g., `instructions`, `tags`) parse them as `List<String>`.

Security / Production:
- Replace permissive CORS with specific origins.
- Switch to Postgres for production by setting `DATABASE_URL` env var and migrating the schema.
