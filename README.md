# Frames Inventory — Backend

REST API for the Frames Inventory management system. Handles eyewear frame data, overstock locations, and restock requests.

## Tech Stack

- **Node.js** + **Express**
- **MySQL**
- **Knex.js** — query builder, migrations, and seeds

## Getting Started

### Prerequisites

- Node.js v18+
- MySQL

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/TommieeN/frames-inventory-back-end.git
   cd frames-inventory-back-end
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your database credentials.

4. Run migrations
   ```bash
   npx knex migrate:latest
   ```

5. Seed the database
   ```bash
   npx knex seed:run
   ```

6. Start the server
   ```bash
   node index.js
   ```
   API runs on `http://localhost:3333`

---

## API Endpoints

### Frames

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/frames/:upc` | Look up a frame by UPC |

### Overstock

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/frames-overstock` | Get all overstock entries |
| POST | `/frames-overstock` | Add a frame to overstock |
| PUT | `/frames-overstock/:id` | Update an overstock entry |
| DELETE | `/frames-overstock/:id` | Delete an overstock entry |

### Restock Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/restock-requests` | Get all restock requests |
| POST | `/restock-requests` | Create a new restock request |
| PATCH | `/restock-requests/:id/complete` | Mark a request as delivered |
| DELETE | `/restock-requests/:id` | Delete a restock request |

---

## Database Schema

### `frames`
| Column | Type | Description |
|--------|------|-------------|
| upc | BIGINT (PK) | Universal Product Code |
| sku | VARCHAR | Stock Keeping Unit |
| description | VARCHAR | Frame name and color |
| color_code | VARCHAR | Manufacturer color code |
| brand | VARCHAR | Brand name |

### `overstock`
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment ID |
| upc | BIGINT (FK) | References frames.upc |
| location | VARCHAR | Physical shelf/bin location |
| quantity | INT | Number of units |
| last_updated | TIMESTAMP | Last update time |

### `restock_requests`
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment ID |
| upc | BIGINT (FK) | References frames.upc |
| status | ENUM | `PENDING` or `DELIVERED` |
| requested_at | TIMESTAMP | When the request was created |
| completed_at | TIMESTAMP | When the request was fulfilled |
| delivered_quantity | INT | Total units pulled |

## Related

- [Frames Inventory — Frontend](https://github.com/TommieeN/frames-inventory-front-end)
