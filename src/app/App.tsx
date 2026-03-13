import React from 'react';
import { EmployeeService } from '../domain/EmployeeService';
import { InMemoryEmployeeRepository } from '../infrastructure/InMemoryEmployeeRepository';
import useEmployees from './useEmployees';
import EmployeeList from '../components/EmployeeList';
import EmployeeForm from '../components/EmployeeForm';

const repository = new InMemoryEmployeeRepository();
const service = new EmployeeService(repository);

/**
 * Root application component for the Employee management app.
 */
function App(): React.JSX.Element {
  const {
    employees, isLoading, error, addEmployee, removeEmployee,
  } = useEmployees(service);

  return (
    <main>
      <h1>Employee Management</h1>
      {error && <p role="alert">{error}</p>}
      <EmployeeForm onSubmit={addEmployee} isLoading={isLoading} />
      <EmployeeList employees={employees} onDelete={removeEmployee} />
    </main>
  );
}

export default App;
