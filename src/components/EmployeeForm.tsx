import React, { useState } from 'react';
import { CreateEmployeeInput } from '../domain/Employee';

interface EmployeeFormProps {
  /** Called with validated input when the form is submitted. */
  onSubmit: (input: CreateEmployeeInput) => void;
  /** Whether the form is in a loading / submitting state. */
  isLoading?: boolean;
}

const INITIAL_STATE: CreateEmployeeInput = {
  name: '',
  email: '',
  role: '',
  department: '',
};

/**
 * Form for creating a new employee.
 *
 * @example
 * ```tsx
 * <EmployeeForm onSubmit={(data) => service.createEmployee(data)} />
 * ```
 */
function EmployeeForm({ onSubmit, isLoading = false }: EmployeeFormProps): React.JSX.Element {
  const [values, setValues] = useState<CreateEmployeeInput>(INITIAL_STATE);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(values);
    setValues(INITIAL_STATE);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="name">
        Name
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          required
        />
      </label>

      <label htmlFor="email">
        Email
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          required
        />
      </label>

      <label htmlFor="role">
        Role
        <input
          id="role"
          name="role"
          type="text"
          value={values.role}
          onChange={handleChange}
          required
        />
      </label>

      <label htmlFor="department">
        Department
        <input
          id="department"
          name="department"
          type="text"
          value={values.department}
          onChange={handleChange}
          required
        />
      </label>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Add Employee'}
      </button>
    </form>
  );
}

export default EmployeeForm;
