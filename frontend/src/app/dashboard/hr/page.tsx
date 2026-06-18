import { getUserDetails, createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HREmployeeList from '@/app/dashboard/hr/HREmployeeList'

export default async function HRDashboard() {
  const details = await getUserDetails()
  
  if (!details?.employee || !['hr', 'admin'].includes(details.employee.role)) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-stack-lg w-full animate-in fade-in duration-500">
      
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-xl bg-primary-container p-10 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="relative z-10 text-center md:text-left">
          <h2 className="font-display-lg text-[36px] md:text-display-lg text-on-primary font-bold mb-2 tracking-tight">
            HR Management Console
          </h2>
          <p className="font-body-lg text-on-primary-container max-w-2xl opacity-90 mt-2">
            Manage active company employees, track and edit leave allocations, and oversee system directories.
          </p>
        </div>
        
        {/* Abstract Atmospheric Element */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-secondary rounded-full blur-[100px] opacity-20"></div>
      </section>

      {/* Directory Table Wrapper */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-stack-lg py-5 border-b border-outline-variant flex items-center justify-between">
          <h3 className="font-title-md text-title-md text-primary tracking-tight">Global Employee Directory</h3>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-container/20 text-secondary-container font-label-sm rounded-full">
            <span className="material-symbols-outlined text-[16px]">shield_person</span>
            HR Access
          </span>
        </div>
        <div className="p-stack-md sm:p-stack-lg">
          <HREmployeeList initialEmployees={employees || []} />
        </div>
      </div>
    </div>
  )
}
