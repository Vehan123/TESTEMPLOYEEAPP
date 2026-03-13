import React from 'react';
import { Employee } from '../domain/Employee';

interface EmployeeCardProps {
  /** The employee data to display. */
  employee: Employee;
  /** Called when the user clicks the Delete button. */
  onDelete: (id: string) => void;
}

/**
 * Displays a single employee's information with a delete action.
 *
 * @example
 * ```tsx
 * <EmployeeCard employee={emp} onDelete={(id) => handleDelete(id)} />
 * ```
 */
function EmployeeCard({ employee, onDelete }: EmployeeCardProps): React.JSX.Element {
  const handleDelete = () => onDelete(employee.id);

  return (
    <article data-testid={`employee-card-${employee.id}`}>
      <h3>{employee.name}</h3>
      <p>{employee.role}</p>
      <p>{employee.department}</p>
      <p>{employee.email}</p>
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
    </article>
  );
}

export default EmployeeCard;
