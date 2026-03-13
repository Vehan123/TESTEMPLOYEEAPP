import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from './Employee';

/**
 * Contract for the employee repository that the service depends on.
 * Implementations live in /src/infrastructure.
 */
export interface EmployeeRepository {
  /** Retrieve all employees. */
  getAll(): Promise<Employee[]>;
  /** Retrieve a single employee by ID. Returns `null` if not found. */
  getById(id: string): Promise<Employee | null>;
  /** Persist a new employee and return the created record. */
  create(data: CreateEmployeeInput): Promise<Employee>;
  /** Update an existing employee and return the updated record. */
  update(id: string, data: UpdateEmployeeInput): Promise<Employee>;
  /** Remove an employee by ID. */
  delete(id: string): Promise<void>;
}
