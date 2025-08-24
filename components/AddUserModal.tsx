import React, { useState } from 'react';
import { Role, Department } from '../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUser: (email: string, personalEmail: string, role: Role, department: Department) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onCreateUser }) => {
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.Analyst);
  const [department, setDepartment] = useState<Department>(Department.Unassigned);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onCreateUser(email, personalEmail, role, department);
    setLoading(false);
    // Parent component will handle closing on success
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="material-thick rounded-lg w-full max-w-md mx-4 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Add New User</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Work Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-300">Personal Email (for password delivery)</label>
              <input
                type="email"
                id="personalEmail"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(Role).filter(r => r !== Role.Admin).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-300">Department</label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                 {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;