import React from 'react';
import { Employee } from '../domain/Employee';
import EmployeeCard from './EmployeeCard';

interface EmployeeListProps {
  /** The list of employees to display. */
  employees: Employee[];
  /** Called when the user deletes an employee. */
  onDelete: (id: string) => void;
}

/**
 * Renders a list of {@link EmployeeCard} components.
 * Displays an empty-state message when no employees exist.
 *
 * @example
 * ```tsx
 * <EmployeeList employees={employees} onDelete={(id) => handleDelete(id)} />
 * ```
 */
function EmployeeList({ employees, onDelete }: EmployeeListProps): React.JSX.Element {
  if (employees.length === 0) {
    return <p>No employees found.</p>;
  }

  return (
    <section>
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} onDelete={onDelete} />
      ))}
    </section>
  );
}

export default EmployeeList;
