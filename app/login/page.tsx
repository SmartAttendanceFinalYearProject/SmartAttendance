"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"  
import { User, Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Login failed")
      }

      // Store token and user info
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user_role", data.role)
      localStorage.setItem("full_name", data.full_name)

      // Show success toast
      toast.success(`Welcome back, ${data.full_name || username}!`)

      // Redirect based on role
      setTimeout(() => {
        if (data.role === "teacher") {
          router.push("/teacher/dashboard")
        } else if (data.role === "admin") {
          router.push("/admin/analytics")
        } else {
          router.push("/dashboard")
        }
      }, 1000)
    } catch (error: any) {
      // Show error toast
      toast.error(error.message || "Invalid username or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <Card className="w-full max-w-md border-white/5 bg-card/60 backdrop-blur-xl shadow-2xl animate-fade-in-up transition-all hover:border-white/10 relative z-10">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-blue-400" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access the SMART Attendance dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-slate-300">Username</Label>
              <div className="relative group">
                <div className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-blue-400">
                  <User size={18} />
                </div>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-300">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 transition-colors group-focus-within:text-blue-400">
                  <Lock size={18} />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all rounded-xl"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all group overflow-hidden"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}