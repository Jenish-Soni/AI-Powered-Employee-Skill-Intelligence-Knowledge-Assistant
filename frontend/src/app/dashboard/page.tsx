import { getUserDetails } from '@/utils/supabase/server'

export default async function DashboardOverview() {
  const details = await getUserDetails()
  const employee = details?.employee

  if (!employee) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-20 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_12px_rgba(15,23,42,0.05)]">
        <p className="text-on-surface font-title-md">No employee records found.</p>
        <p className="text-body-md text-on-surface-variant mt-2">Please contact your HR administrator.</p>
      </div>
    )
  }

  const joinDate = employee.joining_date 
    ? new Date(employee.joining_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not Specified'

  const formattedName = employee.first_name 
    ? `${employee.first_name} ${employee.last_name || ''}`.trim() 
    : employee.email.split('@')[0]

  // Calculate percentages dynamically based on DB values
  const maxPlanned = 24; // Assuming 24 days total planned leave
  const maxUnplanned = 10; // Assuming 10 days total unplanned leave
  const plannedPct = Math.max(0, Math.min(100, Math.round(((maxPlanned - employee.planned_leaves) / maxPlanned) * 100)));
  const unplannedPct = Math.max(0, Math.min(100, Math.round(((maxUnplanned - employee.unplanned_leaves) / maxUnplanned) * 100)));

  return (
    <div className="space-y-stack-lg w-full animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-primary-container p-10 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="relative z-10 text-center md:text-left">
          <h2 className="font-display-lg text-[36px] md:text-display-lg text-on-primary font-bold mb-2 tracking-tight">
            Welcome back, {formattedName}
          </h2>
          <p className="font-body-lg text-on-primary-container max-w-md opacity-90 mt-2">
            Here is your HR overview. You have joined on {joinDate} and your current access role is <span className="font-bold capitalize text-primary-fixed">{employee.role}</span>.
          </p>
          <div className="mt-8 flex gap-4 justify-center md:justify-start">
            <button className="px-6 py-2.5 bg-secondary text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-secondary/20 cursor-pointer active:scale-95">
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              View Goals
            </button>
            <button className="px-6 py-2.5 border border-on-primary-container/30 text-on-primary-container rounded-lg font-semibold hover:bg-white/5 transition-all cursor-pointer">
              Training Portal
            </button>
          </div>
        </div>
        
        {/* Abstract Atmospheric Element */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-secondary rounded-full blur-[100px] opacity-20"></div>
      </section>

      {/* Dashboard Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Leave Balance Section */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-title-md text-title-md text-primary tracking-tight">Leave Balance</h3>
            <button className="text-secondary font-semibold font-label-sm hover:underline cursor-pointer">Request History</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Planned Leave */}
            <div className="flex items-center gap-6 p-6 rounded-xl bg-surface-container-low transition-colors hover:bg-surface-container">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-outline-variant/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                  <path className="text-secondary transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${plannedPct}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-title-md font-bold text-primary leading-none">{employee.planned_leaves}</span>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">DAYS</span>
                </div>
              </div>
              <div>
                <h4 className="font-label-sm text-on-surface-variant mb-1 tracking-wider">Planned Leave</h4>
                <p className="text-headline-lg-mobile font-bold text-primary">{plannedPct}%</p>
                <span className="text-body-sm font-normal text-on-surface-variant">Remaining</span>
                <p className="text-[11px] text-secondary mt-1 font-medium">Valid until Dec 2024</p>
              </div>
            </div>

            {/* Unplanned Leave */}
            <div className="flex items-center gap-6 p-6 rounded-xl bg-surface-container-low transition-colors hover:bg-surface-container">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-outline-variant/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                  <path className="text-error transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${unplannedPct}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-title-md font-bold text-primary leading-none">{employee.unplanned_leaves}</span>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">DAYS</span>
                </div>
              </div>
              <div>
                <h4 className="font-label-sm text-on-surface-variant mb-1 tracking-wider">Unplanned Leave</h4>
                <p className="text-headline-lg-mobile font-bold text-primary">{unplannedPct}%</p>
                <span className="text-body-sm font-normal text-on-surface-variant">Remaining</span>
                <p className="text-[11px] text-error mt-1 font-medium">Resetting in 14 days</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-outline-variant flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-secondary"></span>
              <span className="text-label-sm font-bold text-on-surface-variant">Sick Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-container"></span>
              <span className="text-label-sm font-bold text-on-surface-variant">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error"></span>
              <span className="text-label-sm font-bold text-on-surface-variant">Personal Days</span>
            </div>
          </div>
        </div>

        {/* Skills Matrix Section */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-md text-title-md text-primary tracking-tight">Skills Matrix</h3>
            <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors text-[20px]">edit</span>
          </div>
          
          <div className="space-y-6 flex-1">
            {/* Technical Expertise */}
            <div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-3 text-[11px] font-bold">TECHNICAL EXPERTISE</p>
              <div className="flex flex-wrap gap-2">
                {employee.skills?.technical?.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-secondary-container/50 text-secondary rounded-full text-label-sm font-semibold border border-secondary-container">{skill}</span>
                )) || <span className="text-on-surface-variant text-body-sm">No skills added</span>}
              </div>
            </div>
            
            {/* Soft Skills */}
            <div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-3 text-[11px] font-bold">SOFT SKILLS</p>
              <div className="flex flex-wrap gap-2">
                {employee.skills?.soft?.map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-surface-container-low text-on-surface rounded-full text-label-sm font-medium border border-outline-variant/50">{skill}</span>
                )) || <span className="text-on-surface-variant text-body-sm">No skills added</span>}
              </div>
            </div>
          </div>

          {/* Skill Assessment Box */}
          <div className="mt-6 p-4 bg-primary-container rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-label-md text-on-primary-container font-bold mb-0.5">Skill Assessment</h4>
              <p className="text-[11px] text-on-primary-container/80">Next review scheduled for Aug 22</p>
            </div>
            <span className="material-symbols-outlined text-secondary">verified</span>
          </div>
        </div>

        {/* Recent Milestones Section */}
        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg shadow-sm">
          <h3 className="font-title-md text-title-md text-primary tracking-tight mb-8">Recent Milestones</h3>
          
          <div className="relative pl-6 space-y-10 before:absolute before:inset-y-0 before:left-6 before:w-[2px] before:bg-outline-variant/30">
            
            {employee.milestones?.map((milestone: any, index: number) => (
              <div key={index} className="relative">
                <div className="absolute -left-[30px] w-10 h-10 rounded-full bg-secondary flex items-center justify-center border-4 border-surface-container-lowest">
                  <span className="material-symbols-outlined text-white text-[20px]">{milestone.icon || 'check_circle'}</span>
                </div>
                <div className="pl-12 flex justify-between items-start">
                  <div>
                    <h4 className="font-title-sm text-primary font-bold">{milestone.title}</h4>
                    <p className="text-body-sm text-on-surface-variant mt-1 max-w-2xl">{milestone.desc}</p>
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase">{milestone.time}</span>
                </div>
              </div>
            ))}

            {(!employee.milestones || employee.milestones.length === 0) && (
              <p className="text-on-surface-variant text-body-sm pl-12">No recent milestones found.</p>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
