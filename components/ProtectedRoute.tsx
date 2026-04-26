"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const role = localStorage.getItem("user_role")

    if (!token) {
      router.push("/login")
      return
    }

    if (allowedRoles && allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
      // User does not have permission for this route
      if (role === "teacher") {
        router.push("/teacher/dashboard")
      } else if (role === "admin") {
        router.push("/admin/analytics")
      } else {
        router.push("/dashboard")
      }
      return
    }

    setIsAuthorized(true)
  }, [router, allowedRoles])

  if (!isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-slate-400 font-medium animate-pulse">Verifying access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
