import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeeList from '../EmployeeList';
import { Employee } from '../../domain/Employee';

const employees: Employee[] = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Engineer',
    department: 'Engineering',
  },
  {
    id: '2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    role: 'Manager',
    department: 'HR',
  },
];

describe('EmployeeList', () => {
  it('renders an empty-state message when there are no employees', () => {
    render(<EmployeeList employees={[]} onDelete={jest.fn()} />);
    expect(screen.getByText(/no employees found/i)).toBeInTheDocument();
  });

  it('renders a card for each employee', () => {
    render(<EmployeeList employees={employees} onDelete={jest.fn()} />);

    expect(screen.getByTestId('employee-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('employee-card-2')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });
});
