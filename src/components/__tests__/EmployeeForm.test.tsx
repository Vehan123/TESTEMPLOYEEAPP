import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeeForm from '../EmployeeForm';

describe('EmployeeForm', () => {
  it('renders all input fields and the submit button', () => {
    render(<EmployeeForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
  });

  it('calls onSubmit with form values when submitted', () => {
    const onSubmit = jest.fn();
    render(<EmployeeForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Carol White' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'carol@example.com' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Designer' } });
    fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Design' } });

    fireEvent.click(screen.getByRole('button', { name: /add employee/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Carol White',
      email: 'carol@example.com',
      role: 'Designer',
      department: 'Design',
    });
  });

  it('resets the form after submission', () => {
    render(<EmployeeForm onSubmit={jest.fn()} />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Dave Brown' } });
    fireEvent.click(screen.getByRole('button', { name: /add employee/i }));

    expect(nameInput.value).toBe('');
  });

  it('disables the submit button when isLoading is true', () => {
    render(<EmployeeForm onSubmit={jest.fn()} isLoading />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
