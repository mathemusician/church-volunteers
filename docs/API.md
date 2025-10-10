# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints (except authentication endpoints) require a valid session token obtained through Keycloak OIDC authentication.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### POST /api/auth/signin

Sign in with Keycloak.

**Response:**

```json
{
  "url": "http://localhost:8080/realms/church-volunteers/protocol/openid-connect/auth?..."
}
```

#### POST /api/auth/signout

Sign out the current user.

**Response:**

```json
{
  "message": "Signed out successfully"
}
```

### Volunteers

#### GET /api/volunteers

Get all volunteers.

**Response:**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "phone": "123-456-7890",
    "availability": {},
    "skills": ["Teaching", "Music"],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### GET /api/volunteers/:id

Get a specific volunteer by ID.

**Response:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "phone": "123-456-7890",
  "availability": {},
  "skills": ["Teaching", "Music"],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### POST /api/volunteers

Create a new volunteer.

**Request Body:**

```json
{
  "user_id": "uuid",
  "phone": "123-456-7890",
  "availability": {},
  "skills": ["Teaching", "Music"]
}
```

**Response:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "phone": "123-456-7890",
  "availability": {},
  "skills": ["Teaching", "Music"],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### PUT /api/volunteers/:id

Update a volunteer.

**Request Body:**

```json
{
  "phone": "123-456-7890",
  "availability": {},
  "skills": ["Teaching", "Music", "Technical"]
}
```

**Response:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "phone": "123-456-7890",
  "availability": {},
  "skills": ["Teaching", "Music", "Technical"],
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### DELETE /api/volunteers/:id

Delete a volunteer.

**Response:**

```json
{
  "message": "Volunteer deleted successfully"
}
```

### Events

#### GET /api/events

Get all events.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `start_date` (optional): Filter by start date
- `end_date` (optional): Filter by end date

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Sunday Service",
      "description": "Weekly Sunday service",
      "start_time": "2025-01-01T10:00:00Z",
      "end_time": "2025-01-01T12:00:00Z",
      "location": "Main Sanctuary",
      "created_by": "uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

#### POST /api/events

Create a new event.

**Request Body:**

```json
{
  "title": "Sunday Service",
  "description": "Weekly Sunday service",
  "start_time": "2025-01-01T10:00:00Z",
  "end_time": "2025-01-01T12:00:00Z",
  "location": "Main Sanctuary"
}
```

**Response:**

```json
{
  "id": "uuid",
  "title": "Sunday Service",
  "description": "Weekly Sunday service",
  "start_time": "2025-01-01T10:00:00Z",
  "end_time": "2025-01-01T12:00:00Z",
  "location": "Main Sanctuary",
  "created_by": "uuid",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

### Volunteer Assignments

#### GET /api/assignments

Get all volunteer assignments.

**Query Parameters:**

- `event_id` (optional): Filter by event ID
- `volunteer_id` (optional): Filter by volunteer ID
- `status` (optional): Filter by status

**Response:**

```json
[
  {
    "id": "uuid",
    "event_id": "uuid",
    "volunteer_id": "uuid",
    "status": "confirmed",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### POST /api/assignments

Create a new volunteer assignment.

**Request Body:**

```json
{
  "event_id": "uuid",
  "volunteer_id": "uuid"
}
```

**Response:**

```json
{
  "id": "uuid",
  "event_id": "uuid",
  "volunteer_id": "uuid",
  "status": "pending",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### PATCH /api/assignments/:id

Update an assignment status.

**Request Body:**

```json
{
  "status": "confirmed"
}
```

**Response:**

```json
{
  "id": "uuid",
  "event_id": "uuid",
  "volunteer_id": "uuid",
  "status": "confirmed",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are rate-limited to 100 requests per minute per user.

## Pagination

Endpoints that return lists support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Paginated responses include:

- `data`: Array of items
- `total`: Total number of items
- `page`: Current page number
- `limit`: Items per page
- `hasMore`: Whether there are more pages
