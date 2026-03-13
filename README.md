# Employee Management System

A full-stack Employee Management System built with **Node.js / Express / SQLite** (backend) and **React / Vite** (frontend).

## Features

- **CRUD operations** – Create, Read, Update, and Delete employee records
- **Employee fields** – ID, Name, Email, Department, Role, Hire Date
- **Department filter** – Search/filter employees by department
- **RESTful API** – Clean JSON API with proper HTTP status codes
- **Input validation** – Client-side and server-side validation with helpful error messages

## Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Backend  | Node.js, Express 5, SQLite (better-sqlite3) |
| Frontend | React 19, Vite, Axios         |
| Database | SQLite (file `data/employees.db`) |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app entry point
│   │   ├── db/database.js      # SQLite setup & schema
│   │   ├── routes/employees.js # REST routes
│   │   └── tests/              # Node built-in test runner tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main application component
│   │   ├── EmployeeForm.jsx    # Add / edit form component
│   │   ├── api.js              # Axios API service layer
│   │   └── App.css / index.css
│   └── package.json
├── data/                       # SQLite DB file (created at runtime)
└── package.json                # Root convenience scripts
```

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install dependencies

```bash
npm run install:all
```

### Run the backend (port 3001)

```bash
npm run start:backend
```

### Run the frontend (port 5173)

```bash
npm run start:frontend
```

Open http://localhost:5173 in your browser.

## API Reference

Base URL: `http://localhost:3001/api`

| Method | Endpoint                     | Description                     |
|--------|------------------------------|---------------------------------|
| GET    | `/employees`                 | List all employees              |
| GET    | `/employees?department=HR`   | Filter employees by department  |
| GET    | `/employees/:id`             | Get a single employee           |
| POST   | `/employees`                 | Create a new employee           |
| PUT    | `/employees/:id`             | Update an employee              |
| DELETE | `/employees/:id`             | Delete an employee              |

### Employee object

```json
{
  "id": 1,
  "name": "Alice Smith",
  "email": "alice@example.com",
  "department": "Engineering",
  "role": "Developer",
  "hire_date": "2023-01-15"
}
```

## Running Tests

```bash
npm run test:backend
```
