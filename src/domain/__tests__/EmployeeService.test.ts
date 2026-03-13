import { EmployeeService, ValidationError } from '../EmployeeService';
import { InMemoryEmployeeRepository } from '../../infrastructure/InMemoryEmployeeRepository';
import { CreateEmployeeInput } from '../Employee';

const makeService = () => new EmployeeService(new InMemoryEmployeeRepository());

const validInput: CreateEmployeeInput = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'Engineer',
  department: 'Engineering',
};

describe('EmployeeService', () => {
  describe('getAllEmployees', () => {
    it('returns an empty list when no employees exist', async () => {
      const service = makeService();
      expect(await service.getAllEmployees()).toEqual([]);
    });
  });

  describe('createEmployee', () => {
    it('creates an employee and returns it with an id', async () => {
      const service = makeService();
      const employee = await service.createEmployee(validInput);

      expect(employee.id).toBeDefined();
      expect(employee.name).toBe('Alice Smith');
      expect(employee.email).toBe('alice@example.com');
    });

    it('trims whitespace from name, role, and department', async () => {
      const service = makeService();
      const employee = await service.createEmployee({
        name: '  Bob  ',
        email: 'bob@example.com',
        role: '  Manager  ',
        department: '  HR  ',
      });

      expect(employee.name).toBe('Bob');
      expect(employee.role).toBe('Manager');
      expect(employee.department).toBe('HR');
    });

    it('normalises email to lowercase', async () => {
      const service = makeService();
      const employee = await service.createEmployee({
        ...validInput,
        email: 'ALICE@EXAMPLE.COM',
      });

      expect(employee.email).toBe('alice@example.com');
    });

    it('throws ValidationError when name is blank', async () => {
      const service = makeService();
      await expect(
        service.createEmployee({ ...validInput, name: '   ' }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when email is blank', async () => {
      const service = makeService();
      await expect(
        service.createEmployee({ ...validInput, email: '   ' }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when email is invalid', async () => {
      const service = makeService();
      await expect(
        service.createEmployee({ ...validInput, email: 'not-an-email' }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when role is blank', async () => {
      const service = makeService();
      await expect(
        service.createEmployee({ ...validInput, role: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when department is blank', async () => {
      const service = makeService();
      await expect(
        service.createEmployee({ ...validInput, department: '' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getEmployeeById', () => {
    it('returns the employee when found', async () => {
      const service = makeService();
      const created = await service.createEmployee(validInput);
      const found = await service.getEmployeeById(created.id);

      expect(found).toEqual(created);
    });

    it('returns null when the employee does not exist', async () => {
      const service = makeService();
      expect(await service.getEmployeeById('non-existent')).toBeNull();
    });
  });

  describe('updateEmployee', () => {
    it('updates the employee role', async () => {
      const service = makeService();
      const created = await service.createEmployee(validInput);
      const updated = await service.updateEmployee(created.id, { role: 'Senior Engineer' });

      expect(updated.role).toBe('Senior Engineer');
      expect(updated.name).toBe(created.name);
    });

    it('throws ValidationError when updating with blank role', async () => {
      const service = makeService();
      const created = await service.createEmployee(validInput);
      await expect(
        service.updateEmployee(created.id, { role: '' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteEmployee', () => {
    it('removes the employee from the list', async () => {
      const service = makeService();
      const created = await service.createEmployee(validInput);
      await service.deleteEmployee(created.id);

      const remaining = await service.getAllEmployees();
      expect(remaining).toHaveLength(0);
    });
  });
});
