'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  role: 'admin' | 'hr' | 'employee'
  email?: string
  name?: string
}

export default function Sidebar({ role, email, name }: SidebarProps) {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['admin', 'hr', 'employee'] },
    { name: 'Team', href: '/dashboard/hr', icon: 'group', roles: ['admin', 'hr'] },
    { name: 'Admin Console', href: '/dashboard/admin', icon: 'admin_panel_settings', roles: ['admin'] },
  ]

  const filteredLinks = links.filter(link => link.roles.includes(role))

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 shrink-0 bg-surface-container-low border-r border-outline-variant py-stack-lg px-stack-md z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg shadow-sm">
          <span className="material-symbols-outlined text-on-primary">corporate_fare</span>
        </div>
        <div>
          <h2 className="font-title-md text-title-md font-bold text-primary leading-tight tracking-tight">PortalCore</h2>
          <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">HR Suite</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1.5">
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg font-label-sm ${
                isActive 
                  ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-on-secondary-container' : 'text-outline'}`}>
                {link.icon}
              </span>
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-6 border-t border-outline-variant">
        <form action="/auth/signout" method="post">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-error rounded-lg hover:bg-error-container/50 transition-colors cursor-pointer group">
            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">logout</span>
            <span className="font-label-sm font-semibold">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
