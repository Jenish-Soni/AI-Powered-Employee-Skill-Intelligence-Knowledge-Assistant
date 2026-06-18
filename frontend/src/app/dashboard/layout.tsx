import { redirect } from 'next/navigation'
import { getUserDetails } from '@/utils/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import ChatWidget from '@/components/chat/ChatWidget'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const details = await getUserDetails()

  if (!details?.user) {
    redirect('/login')
  }

  const role = details.employee?.role || 'employee'
  const name = details.employee?.first_name || 'Employee'
  const email = details.employee?.email || ''
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-background text-on-background overflow-hidden font-body-md">
      <Sidebar 
        role={role} 
        email={email} 
        name={name} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-margin-desktop shrink-0 w-full h-16 bg-surface-container-lowest border-b border-outline-variant z-40">
          <div className="flex items-center gap-6">
            {/* Mobile Title */}
            <h1 className="md:hidden font-headline-lg text-[20px] font-bold text-primary">PortalCore</h1>
            <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-1.5 border border-outline-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/20 transition-all">
              <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
              <input 
                className="bg-transparent border-none p-0 focus:ring-0 text-body-md w-64 text-on-surface outline-none placeholder:text-outline" 
                placeholder="Search resources..." 
                type="text"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-container-low text-secondary transition-colors cursor-pointer active:scale-95 duration-150">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-label-sm text-on-surface">{name}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shadow-sm border border-secondary/20">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop pb-32">
          <div className="max-w-container-max mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <ChatWidget role={role} />
    </div>
  )
}
