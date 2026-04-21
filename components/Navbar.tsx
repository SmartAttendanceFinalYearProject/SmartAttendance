"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User, LayoutDashboard, Camera, UserPlus, BarChart3 } from "lucide-react"

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Sync role from localStorage
    const storedRole = localStorage.getItem("user_role")
    setRole(storedRole)
    
    // Listen for storage changes (optional but good for cross-tab or same-tab updates)
    const handleStorageChange = () => {
      setRole(localStorage.getItem("user_role"))
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [pathname]) // Re-check on route change to handle login/logout

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_role")
    localStorage.removeItem("full_name")
    setRole(null)
    router.push("/login")
  }

  // If on login page, show minimal navbar
  if (pathname === "/login") {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-transparent backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center space-x-2 transition-all hover:opacity-80">
            <span className="text-xl font-extrabold tracking-tight text-white">
              SMART<span className="text-blue-400 pl-3">ATTENDANCE</span>
            </span>
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-transparent backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2 transition-all hover:opacity-80">
          <span className="text-xl font-extrabold tracking-tight text-white">
            SMART<span className="text-blue-400 pl-3">ATTENDANCE</span>
          </span>
        </Link>
        
        <div className="flex items-center space-x-1">
          <div className="hidden md:flex items-center space-x-1 mr-4">
            {role === "teacher" && (
              <>
                <Button variant="ghost" size="sm" className={`font-semibold transition-all ${pathname === "/teacher/scanner" ? "text-blue-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}`} asChild>
                  <Link href="/teacher/scanner">
                    <Camera size={16} className="mr-2" />
                    Scanner
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className={`font-semibold transition-all ${pathname === "/teacher/dashboard" ? "text-blue-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}`} asChild>
                  <Link href="/teacher/dashboard">
                    <LayoutDashboard size={16} className="mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </>
            )}
            {role === "admin" && (
              <>
                <Button variant="ghost" size="sm" className={`font-semibold transition-all ${pathname === "/admin/analytics" ? "text-blue-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}`} asChild>
                  <Link href="/admin/analytics">
                    <BarChart3 size={16} className="mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className={`font-semibold transition-all ${pathname === "/admin/register" ? "text-blue-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}`} asChild>
                  <Link href="/admin/register">
                    <UserPlus size={16} className="mr-2" />
                    Registration
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {role ? (
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm" 
                className="font-bold border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl px-4"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            ) : (
              <Button size="sm" className="font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-5 rounded-xl" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
