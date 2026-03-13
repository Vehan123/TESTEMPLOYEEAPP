/**
 * Represents an employee in the system.
 */
export interface Employee {
  /** Unique identifier for the employee. */
  id: string;
  /** Full name of the employee. */
  name: string;
  /** Email address of the employee. */
  email: string;
  /** Job title of the employee. */
  role: string;
  /** Department the employee belongs to. */
  department: string;
}

/**
 * Data required to create a new employee.
 * Omits the auto-generated `id` field.
 */
export type CreateEmployeeInput = Omit<Employee, 'id'>;

/**
 * Data that can be updated on an existing employee.
 * All fields are optional.
 */
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;
