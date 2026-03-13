import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from './Employee';
import { EmployeeRepository } from './EmployeeRepository';

/** Validation error thrown when employee input is invalid. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that required employee fields are non-empty strings.
 *
 * @param input - The employee input to validate.
 * @throws {ValidationError} When a required field is missing or blank.
 */
function validateEmployeeInput(input: Partial<CreateEmployeeInput>): void {
  const requiredFields: Array<keyof CreateEmployeeInput> = [
    'name',
    'email',
    'role',
    'department',
  ];

  for (const field of requiredFields) {
    const value = input[field];
    if (value !== undefined && value.trim() === '') {
      throw new ValidationError(`Field "${field}" must not be empty.`);
    }
  }

  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new ValidationError(`"${input.email}" is not a valid email address.`);
  }
}

/**
 * Application service that orchestrates employee operations.
 *
 * All business logic lives here; persistence is delegated to the
 * injected {@link EmployeeRepository}.
 *
 * @example
 * ```ts
 * const service = new EmployeeService(new InMemoryEmployeeRepository());
 * const employees = await service.getAllEmployees();
 * ```
 */
export class EmployeeService {
  constructor(private readonly repository: EmployeeRepository) {}

  /**
   * Returns a list of all employees.
   *
   * @returns A promise that resolves with the full employee list.
   */
  async getAllEmployees(): Promise<Employee[]> {
    return this.repository.getAll();
  }

  /**
   * Returns a single employee by their ID.
   *
   * @param id - The employee's unique identifier.
   * @returns The employee record, or `null` when not found.
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    return this.repository.getById(id);
  }

  /**
   * Creates a new employee after validating the input.
   *
   * @param input - Data for the new employee.
   * @returns The persisted employee record with a generated ID.
   * @throws {ValidationError} When required fields are invalid.
   */
  async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    validateEmployeeInput(input);
    return this.repository.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role.trim(),
      department: input.department.trim(),
    });
  }

  /**
   * Updates an existing employee's details.
   *
   * @param id    - The ID of the employee to update.
   * @param input - Partial data to apply to the employee.
   * @returns The updated employee record.
   * @throws {ValidationError} When any provided field is invalid.
   */
  async updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    validateEmployeeInput(input);
    return this.repository.update(id, input);
  }

  /**
   * Deletes an employee by ID.
   *
   * @param id - The ID of the employee to remove.
   */
  async deleteEmployee(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
