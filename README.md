# TESTEMPLOYEEAPP

A minimal Employee management application built with **TypeScript**, **React**, and **clean architecture** principles.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run tests with coverage
npm test

# Lint the source code
npm run lint
```

## Project Structure

```
src/
├── domain/          # Business logic — entities, services, repository contracts
├── infrastructure/  # Concrete implementations (e.g. InMemoryEmployeeRepository)
├── components/      # React UI components (EmployeeCard, EmployeeForm, EmployeeList)
└── app/             # App entry point, root component, and custom hooks
```

## Architecture

The project follows **clean architecture**:

- **Domain layer** (`src/domain/`) contains pure business logic with no framework dependencies.
- **Infrastructure layer** (`src/infrastructure/`) provides concrete data access implementations that satisfy domain interfaces.
- **Component layer** (`src/components/`) contains presentational React components.
- **App layer** (`src/app/`) wires everything together via dependency injection.

## Testing

Tests are written with **Jest** and **React Testing Library**.  
The project enforces a minimum of **80% code coverage**.

```bash
npm test
```

## Contributing

- Use **TypeScript** for all new files.
- Follow the **Airbnb style guide** (enforced by ESLint).
- Write **JSDoc comments** for every public function.
- Never commit secrets or API keys.
- Validate all user input in the domain layer.

