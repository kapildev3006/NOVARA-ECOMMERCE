# NOVARA Backend

This is the Express + MongoDB backend for the NOVARA Ecommerce platform.

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (Atlas or local instance)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and update it with your actual MongoDB connection string:
   ```bash
   cp .env.example .env
   ```
   **Required Variables for Phase 22:**
   - `MONGODB_URI`: Your MongoDB connection string.
   - `PORT`: (Optional, defaults to 5000)
   - `NODE_ENV`: (Optional, defaults to development)

## Development

**Run the development server:**
```bash
npm run dev
```
The server will start on `http://localhost:5000`. You can check the health endpoint at `http://localhost:5000/api/v1/health`.

**Build the project:**
```bash
npm run build
```

**Start production server:**
```bash
npm run start
```

## Database Seeding
To migrate the initial mock data from the frontend into MongoDB, ensure `MONGODB_URI` is correctly set in your `.env`, and run:
```bash
npm run seed
```
This is an idempotent script; running it multiple times will safely update existing records without creating duplicates.
