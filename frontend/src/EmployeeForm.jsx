import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DEPARTMENTS = ['Engineering', 'HR', 'Marketing', 'Finance', 'Sales', 'Operations'];

const EMPTY_FORM = {
  name: '',
  email: '',
  department: '',
  role: '',
  hire_date: '',
};

export default function EmployeeForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        email: initial.email || '',
        department: initial.department || '',
        role: initial.role || '',
        hire_date: initial.hire_date || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setServerError('');
  }, [initial]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.department) errs.department = 'Department is required';
    if (!form.role.trim()) errs.role = 'Role is required';
    if (!form.hire_date) errs.hire_date = 'Hire date is required';
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setServerError(err.response?.data?.error || 'An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="employee-form">
      {serverError && <p className="form-server-error">{serverError}</p>}

      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Full name"
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="email@example.com"
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="department">Department</label>
        <select id="department" name="department" value={form.department} onChange={handleChange}>
          <option value="">— Select department —</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {errors.department && <span className="field-error">{errors.department}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="role">Role</label>
        <input
          id="role"
          name="role"
          type="text"
          value={form.role}
          onChange={handleChange}
          placeholder="Job title / role"
        />
        {errors.role && <span className="field-error">{errors.role}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="hire_date">Hire Date</label>
        <input
          id="hire_date"
          name="hire_date"
          type="date"
          value={form.hire_date}
          onChange={handleChange}
        />
        {errors.hire_date && <span className="field-error">{errors.hire_date}</span>}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initial ? 'Save Changes' : 'Add Employee'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

EmployeeForm.propTypes = {
  initial: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    department: PropTypes.string,
    role: PropTypes.string,
    hire_date: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

EmployeeForm.defaultProps = {
  initial: null,
};
