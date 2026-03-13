import { useState, useEffect, useCallback } from 'react';
import { Employee, CreateEmployeeInput } from '../domain/Employee';
import { EmployeeService } from '../domain/EmployeeService';

interface UseEmployeesReturn {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  addEmployee: (input: CreateEmployeeInput) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
}

/**
 * Hook that manages employee CRUD state.
 * Business logic is delegated to the injected {@link EmployeeService}.
 *
 * @param service - The employee service to use for operations.
 * @returns State and action handlers for the employee list.
 *
 * @example
 * ```tsx
 * const { employees, addEmployee, removeEmployee } = useEmployees(service);
 * ```
 */
function useEmployees(service: EmployeeService): UseEmployeesReturn {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await service.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees.');
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addEmployee = useCallback(
    async (input: CreateEmployeeInput) => {
      setIsLoading(true);
      setError(null);
      try {
        const created = await service.createEmployee(input);
        setEmployees((prev) => [...prev, created]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create employee.');
      } finally {
        setIsLoading(false);
      }
    },
    [service],
  );

  const removeEmployee = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await service.deleteEmployee(id);
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete employee.');
      } finally {
        setIsLoading(false);
      }
    },
    [service],
  );

  return {
    employees,
    isLoading,
    error,
    addEmployee,
    removeEmployee,
  };
}

export default useEmployees;
