import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from './api';
import EmployeeForm from './EmployeeForm';
import './App.css';

const DEPARTMENTS = ['', 'Engineering', 'HR', 'Marketing', 'Finance', 'Sales', 'Operations'];

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEmployees(department || undefined);
      setEmployees(data);
    } catch {
      setError('Failed to load employees. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = () => {
    setEditTarget(null);
    setShowForm(true);
  };

  const handleEdit = (emp) => {
    setEditTarget(emp);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Failed to delete employee.');
    }
  };

  const handleFormSubmit = async (formData) => {
    if (editTarget) {
      const updated = await updateEmployee(editTarget.id, formData);
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      const created = await createEmployee(formData);
      setEmployees((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setShowForm(false);
    setEditTarget(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Employee Management</h1>
      </header>

      <main className="app-main">
        {showForm ? (
          <section className="form-section">
            <h2>{editTarget ? 'Edit Employee' : 'Add New Employee'}</h2>
            <EmployeeForm
              initial={editTarget}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </section>
        ) : (
          <>
            <div className="toolbar">
              <div className="filter-group">
                <label htmlFor="dept-filter">Filter by Department:</label>
                <select
                  id="dept-filter"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d || 'All Departments'}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleAdd}>
                + Add Employee
              </button>
            </div>

            {loading && <p className="status-msg">Loading&hellip;</p>}
            {error && <p className="status-msg error">{error}</p>}

            {!loading && !error && (
              <div className="table-wrapper">
                {employees.length === 0 ? (
                  <p className="empty-msg">No employees found.</p>
                ) : (
                  <table className="employee-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Hire Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => (
                        <tr key={emp.id}>
                          <td>{emp.name}</td>
                          <td>{emp.email}</td>
                          <td>{emp.department}</td>
                          <td>{emp.role}</td>
                          <td>{emp.hire_date}</td>
                          <td className="actions-cell">
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEdit(emp)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(emp.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
