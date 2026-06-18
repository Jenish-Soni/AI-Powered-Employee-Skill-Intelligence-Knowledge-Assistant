'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Employee = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  planned_leaves: number
  unplanned_leaves: number
}

export default function HREmployeeList({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ planned: number, unplanned: number }>({ planned: 0, unplanned: 0 })
  
  const supabase = createClient()

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setEditForm({ planned: emp.planned_leaves, unplanned: emp.unplanned_leaves })
  }

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .update({
        planned_leaves: editForm.planned,
        unplanned_leaves: editForm.unplanned
      })
      .eq('id', id)

    if (!error) {
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, planned_leaves: editForm.planned, unplanned_leaves: editForm.unplanned } : emp))
      setEditingId(null)
    } else {
      alert('Failed to update leave balances')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee? This will permanently remove them from the system.')) {
      try {
        const response = await fetch(`http://localhost:8000/api/hr/employee/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setEmployees(employees.filter(emp => emp.id !== id))
        } else {
          alert('Failed to delete employee')
        }
      } catch (err) {
        alert('Server error connecting to backend')
      }
    }
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="font-label-sm text-label-sm text-on-surface-variant uppercase bg-surface-container-low border-b border-outline-variant/50">
          <tr>
            <th className="px-6 py-4 font-semibold tracking-wider">Employee Details</th>
            <th className="px-6 py-4 font-semibold tracking-wider">Access Level</th>
            <th className="px-6 py-4 font-semibold tracking-wider">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span> 
                Planned Leaves
              </span>
            </th>
            <th className="px-6 py-4 font-semibold tracking-wider">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">event_busy</span> 
                Unplanned Leaves
              </span>
            </th>
            <th className="px-6 py-4 text-right font-semibold tracking-wider">Actions</th>
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-sm text-[10px] tracking-wide ${
                  emp.role === 'admin' 
                    ? 'bg-secondary-container/20 text-secondary-container border border-secondary-container/20' 
                    : emp.role === 'hr' 
                      ? 'bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim' 
                      : 'bg-surface-container-highest text-on-surface border border-outline-variant/30'
                }`}>
                  {emp.role}
                </span>
              </td>
              <td className="px-6 py-4">
                {editingId === emp.id ? (
                  <input 
                    type="number" 
                    min={0}
                    className="w-20 border border-outline-variant rounded-md px-3 py-1.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-surface-container-lowest transition-all" 
                    value={editForm.planned} 
                    onChange={e => setEditForm({...editForm, planned: parseInt(e.target.value) || 0})} 
                  />
                ) : (
                  <span className="font-title-md text-sm font-semibold text-primary">{emp.planned_leaves}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {editingId === emp.id ? (
                  <input 
                    type="number" 
                    min={0}
                    className="w-20 border border-outline-variant rounded-md px-3 py-1.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-surface-container-lowest transition-all" 
                    value={editForm.unplanned} 
                    onChange={e => setEditForm({...editForm, unplanned: parseInt(e.target.value) || 0})} 
                  />
                ) : (
                  <span className="font-title-md text-sm font-semibold text-primary">{emp.unplanned_leaves}</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {editingId === emp.id ? (
                    <>
                      <button 
                        onClick={() => handleSave(emp.id)} 
                        className="text-secondary p-1.5 hover:bg-secondary-container/10 rounded-lg transition-colors cursor-pointer"
                        title="Save Changes"
                      >
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      </button>
                      <button 
                        onClick={() => setEditingId(null)} 
                        className="text-outline p-1.5 hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer hover:text-on-surface-variant"
                        title="Cancel"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleEdit(emp)} 
                        className="text-secondary p-1.5 hover:bg-secondary-container/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit Leave Balances"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(emp.id)} 
                        className="text-error p-1.5 hover:bg-error-container/50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Employee"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center">
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
