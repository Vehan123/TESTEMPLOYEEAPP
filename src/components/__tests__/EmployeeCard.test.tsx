import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeeCard from '../EmployeeCard';
import { Employee } from '../../domain/Employee';

const employee: Employee = {
  id: '1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'Engineer',
  department: 'Engineering',
};

describe('EmployeeCard', () => {
  it('renders the employee name, role, department, and email', () => {
    render(<EmployeeCard employee={employee} onDelete={jest.fn()} />);

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('calls onDelete with the employee id when Delete is clicked', () => {
    const onDelete = jest.fn();
    render(<EmployeeCard employee={employee} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
