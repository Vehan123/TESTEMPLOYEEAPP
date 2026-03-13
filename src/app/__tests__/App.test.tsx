import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App', () => {
  it('renders the page heading', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByRole('heading', { name: /employee management/i })).toBeInTheDocument();
  });

  it('renders the employee form', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('displays a new employee after form submission', async () => {
    await act(async () => {
      render(<App />);
    });

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Carol White' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'carol@example.com' } });
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'Designer' } });
    fireEvent.change(screen.getByLabelText(/department/i), { target: { value: 'Design' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add employee/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });
  });

  it('shows a validation error when invalid data is submitted', async () => {
    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add employee/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

