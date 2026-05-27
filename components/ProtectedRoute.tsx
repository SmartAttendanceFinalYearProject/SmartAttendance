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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500/50" />
        </div>
      </div>
    )
  }


  return <>{children}</>
}
