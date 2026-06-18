'use client'

import { useState } from 'react'

type Employee = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

export default function AdminRoleManager({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleRoleChange = async (id: string, newRole: string) => {
    setUpdatingId(id)
    try {
      const response = await fetch(`http://localhost:8000/api/admin/role/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        setEmployees(employees.map(emp => emp.id === id ? { ...emp, role: newRole } : emp))
      } else {
        alert('Failed to update role. Please ensure the backend is running.')
      }
    } catch (err) {
      alert('Failed to connect to the backend server.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead className="font-label-sm text-label-sm text-on-surface-variant uppercase bg-surface-container-low border-b border-outline-variant/50">
          <tr>
            <th className="px-6 py-4 font-semibold tracking-wider">Employee Details</th>
            <th className="px-6 py-4 font-semibold tracking-wider">Active Role</th>
            <th className="px-6 py-4 text-right font-semibold tracking-wider">Modify System Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {employees.map((emp) => (
            <tr key={emp.id} className="bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors duration-150">
              <td className="px-6 py-4">
                <div className="font-title-md text-sm font-bold text-on-surface">
                  {emp.first_name || emp.last_name ? `${emp.first_name || ''} ${emp.last_name || ''}` : '—'}
                </div>
                <div className="font-body-md text-xs text-on-surface-variant mt-0.5">{emp.email}</div>
              </td>
              <td className="px-6 py-4 capitalize">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-[10px] tracking-wide ${
                  emp.role === 'admin' 
                    ? 'bg-secondary-container/20 text-secondary-container border border-secondary-container/20' 
                    : emp.role === 'hr' 
                      ? 'bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim' 
                      : 'bg-surface-container-highest text-on-surface border border-outline-variant/30'
                }`}>
                  {emp.role === 'admin' && <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>}
                  {emp.role}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <select 
                  className="w-36 border border-outline-variant rounded-lg px-3 py-1.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-surface-container-lowest transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  value={emp.role}
                  onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                  disabled={updatingId === emp.id}
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-outline">
                  <span className="material-symbols-outlined text-[48px] font-light">group_off</span>
                  <p className="font-body-md text-on-surface-variant">No active employee records found.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
