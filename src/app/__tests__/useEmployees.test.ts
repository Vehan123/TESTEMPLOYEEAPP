import { renderHook, act } from '@testing-library/react';
import { EmployeeService } from '../../domain/EmployeeService';
import { EmployeeRepository } from '../../domain/EmployeeRepository';
import { InMemoryEmployeeRepository } from '../../infrastructure/InMemoryEmployeeRepository';
import useEmployees from '../useEmployees';
import { Employee, CreateEmployeeInput } from '../../domain/Employee';

const makeService = () => new EmployeeService(new InMemoryEmployeeRepository());

/** Creates a service backed by a repository that throws on every call. */
function makeFailingService(): EmployeeService {
  const failingRepo: EmployeeRepository = {
    getAll: async () => { throw new Error('getAll failed'); },
    getById: async () => null,
    create: async () => { throw new Error('create failed'); },
    update: async () => { throw new Error('update failed'); },
    delete: async () => { throw new Error('delete failed'); },
  };
  return new EmployeeService(failingRepo);
}

describe('useEmployees', () => {
  it('starts with an empty employee list', async () => {
    const service = makeService();
    const { result } = renderHook(() => useEmployees(service));

    await act(async () => {});

    expect(result.current.employees).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('adds an employee via addEmployee', async () => {
    const service = makeService();
    const { result } = renderHook(() => useEmployees(service));

    await act(async () => {
      await result.current.addEmployee({
        name: 'Alice',
        email: 'alice@example.com',
        role: 'Engineer',
        department: 'Engineering',
      });
    });

    expect(result.current.employees).toHaveLength(1);
    expect(result.current.employees[0].name).toBe('Alice');
  });

  it('removes an employee via removeEmployee', async () => {
    const service = makeService();
    const { result } = renderHook(() => useEmployees(service));

    await act(async () => {
      await result.current.addEmployee({
        name: 'Bob',
        email: 'bob@example.com',
        role: 'Manager',
        department: 'HR',
      });
    });

    const id = result.current.employees[0].id;

    await act(async () => {
      await result.current.removeEmployee(id);
    });

    expect(result.current.employees).toHaveLength(0);
  });

  it('sets an error message when addEmployee validation fails', async () => {
    const service = makeService();
    const { result } = renderHook(() => useEmployees(service));

    await act(async () => {
      await result.current.addEmployee({
        name: '',
        email: 'bad-email',
        role: '',
        department: '',
      });
    });

    expect(result.current.error).not.toBeNull();
  });

  it('sets an error message when the initial fetch fails', async () => {
    const service = makeFailingService();
    const { result } = renderHook(() => useEmployees(service));

    await act(async () => {});

    expect(result.current.error).toBe('getAll failed');
  });

  it('sets an error message when removeEmployee fails', async () => {
    // Seed the in-memory repo first, then swap delete to fail
    const repo = new InMemoryEmployeeRepository([
      { id: '1', name: 'Dave', email: 'd@example.com', role: 'Dev', department: 'Eng' },
    ]);
    repo.delete = async () => { throw new Error('delete failed'); };

    const service = new EmployeeService(repo);
    const { result } = renderHook(() => useEmployees(service));

    await act(async () => {});

    await act(async () => {
      await result.current.removeEmployee('1');
    });

    expect(result.current.error).toBe('delete failed');
  });
});
