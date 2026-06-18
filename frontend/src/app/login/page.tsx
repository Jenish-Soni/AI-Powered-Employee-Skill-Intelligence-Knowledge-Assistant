import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="bg-background h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background visual element from Stitch */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC2O69bKwXPljlKji_ykhFKOLP-eZl_GL9E559NDNO5mo1sZnuzBW5CyfhTiiCVjD7jnoIydyQphFDh7N86ZrjqVgyD4Xv0pXeAahe1Fm2gb_Ds1we8lH5nMpqgLpQKHM34CyLzJTo9gGnJm3ElZloiwTHHztnavZ9rLpSMe32b75HA1XZmr402jO0oWvSEzEEIGNhYLSNO5CB5dOeH3HWdQjjgD1TEqSFPNG9XmOc4wZ581Caf6nuJO9UZrYcZjP0YjQ_4dOTbTqE')" }}
      />
      
      {/* Login Container */}
      <main className="relative z-10 w-full max-w-md px-margin-mobile md:px-0">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg md:p-12 flex flex-col items-center shadow-[0px_4px_12px_rgba(15,23,42,0.05)] transition-transform duration-500 hover:-translate-y-1">
          
          {/* Brand Identity */}
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
                <span className="material-symbols-outlined text-on-primary text-[24px]">hub</span>
              </div>
              <span className="font-headline-lg text-headline-lg font-bold text-primary">PortalCore</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest text-center">
              Enterprise HR Management Suite
            </p>
          </div>

          {/* Header Text */}
          <div className="w-full text-center mb-8">
            <h1 className="font-title-md text-title-md text-on-surface mb-2">Sign in to your account</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Enter your credentials to access the portal.</p>
          </div>

          {/* Login Form */}
          <form action={login} className="w-full space-y-stack-md">
            
            {/* Email Field */}
            <div className="space-y-stack-sm">
              <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="email">
                Email Address
              </label>
              <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-lowest px-4 py-3 transition-all duration-200 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                <span className="material-symbols-outlined text-outline mr-3">mail</span>
                <input 
                  className="w-full border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface bg-transparent outline-none" 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="john.doe@enterprise.com" 
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-stack-sm">
              <div className="flex justify-between items-center">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <a className="font-label-sm text-label-sm text-secondary hover:underline transition-all" href="#">
                  Forgot Password?
                </a>
              </div>
              <div className="flex items-center border border-outline-variant rounded-lg bg-surface-container-lowest px-4 py-3 transition-all duration-200 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                <span className="material-symbols-outlined text-outline mr-3">lock</span>
                <input 
                  className="w-full border-none p-0 focus:ring-0 font-body-md text-body-md text-on-surface bg-transparent outline-none" 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="••••••••" 
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-2 pt-2">
              <input 
                className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary" 
                id="remember" 
                type="checkbox" 
              />
              <label className="font-body-md text-body-md text-on-surface-variant select-none" htmlFor="remember">
                Remember this device
              </label>
            </div>

            {/* Error Message */}
            {resolvedParams?.message && (
              <div className="p-3 bg-error-container border border-error/20 text-on-error-container font-body-md text-sm rounded-lg text-center font-medium animate-in fade-in">
                {resolvedParams.message}
              </div>
            )}

            {/* Action Button */}
            <button 
              className="w-full bg-primary text-on-primary py-4 rounded-lg font-title-md text-title-md font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/10 mt-4 cursor-pointer" 
              type="submit"
            >
              Sign In
            </button>
          </form>

          {/* Social/Other Sign In */}
          <div className="w-full mt-8 pt-8 border-t border-outline-variant flex flex-col items-center">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-4">Or continue with</p>
            <div className="flex gap-4 w-full">
              <button className="flex-1 border border-outline-variant rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors duration-200 group cursor-pointer">
                <span className="font-label-sm text-label-sm text-on-surface group-hover:text-primary transition-colors">SSO</span>
              </button>
              <button className="flex-1 border border-outline-variant rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors duration-200 group cursor-pointer">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">passkey</span>
                <span className="font-label-sm text-label-sm text-on-surface group-hover:text-primary transition-colors">Passkey</span>
              </button>
            </div>
          </div>

          {/* Footer Help */}
          <div className="mt-10 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Need help? <a className="text-secondary font-semibold hover:underline" href="#">Contact HR Support</a>
            </p>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-8 flex justify-center gap-margin-mobile font-label-sm text-label-sm text-outline">
          <a className="hover:text-on-surface-variant transition-colors" href="#">Privacy Policy</a>
          <span className="opacity-30">•</span>
          <a className="hover:text-on-surface-variant transition-colors" href="#">Terms of Service</a>
          <span className="opacity-30">•</span>
          <span>© 2024 PortalCore</span>
        </div>
      </main>
    </div>
  )
}
