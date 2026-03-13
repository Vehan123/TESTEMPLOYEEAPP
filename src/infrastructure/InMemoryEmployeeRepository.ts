import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../domain/Employee';
import { EmployeeRepository } from '../domain/EmployeeRepository';

/** Simple in-memory implementation of {@link EmployeeRepository}. */
export class InMemoryEmployeeRepository implements EmployeeRepository {
  private store: Map<string, Employee>;

  private nextId: number;

  constructor(initialData: Employee[] = []) {
    this.store = new Map(initialData.map((e) => [e.id, e]));
    const maxId = initialData.reduce((max, e) => Math.max(max, parseInt(e.id, 10) || 0), 0);
    this.nextId = maxId + 1;
  }

  async getAll(): Promise<Employee[]> {
    return Array.from(this.store.values());
  }

  async getById(id: string): Promise<Employee | null> {
    return this.store.get(id) ?? null;
  }

  async create(data: CreateEmployeeInput): Promise<Employee> {
    const employee: Employee = { id: String(this.nextId), ...data };
    this.nextId += 1;
    this.store.set(employee.id, employee);
    return employee;
  }

  async update(id: string, data: UpdateEmployeeInput): Promise<Employee> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Employee with id "${id}" not found.`);
    }
    const updated: Employee = { ...existing, ...data };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
