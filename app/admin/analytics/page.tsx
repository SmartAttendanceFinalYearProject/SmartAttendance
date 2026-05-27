"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCcw,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"

type BackendStat = {
  title: string
  value: string
  change: string
  isPositive: boolean
}

type StatRow = BackendStat & { icon: LucideIcon; color: string; bg: string }

type WeeklyDay = { day: string; rate: number }

type Department = { name: string; count: number }

type AnalyticsResponse = {
  stats: BackendStat[]
  weeklyData: WeeklyDay[]
  departments: Department[]
  totalStudentsRaw?: number
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("Last 7 Days")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatRow[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [totalStudents, setTotalStudents] = useState(0)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/admin/analytics/stats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error("Failed to fetch analytics")
      
      const data = (await response.json()) as AnalyticsResponse

      const iconMap: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
        "Average Attendance": { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        "Total Students": { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        "Total Classes": { icon: BookOpen, color: "text-amber-400", bg: "bg-amber-500/10" },
        "Active Teachers": { icon: CheckCircle2, color: "text-purple-400", bg: "bg-purple-500/10" },
      }

      const formattedStats: StatRow[] = data.stats.map((s) => ({
        ...s,
        ...(iconMap[s.title] ?? {
          icon: BarChart3,
          color: "text-slate-400",
          bg: "bg-slate-500/10",
        }),
      }))

      setStats(formattedStats)
      setWeeklyData(data.weeklyData)
      setDepartments(data.departments)
      setTotalStudents(data.totalStudentsRaw || 1)
    } catch (error) {
      console.error(error)
      toast.error("Error loading analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Loading analytics data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Reports & Analysis
          </h1>
          <p className="text-sm text-slate-400">
            Comprehensive overview of attendance patterns and student metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchAnalytics}
            className="border-white/10 bg-white/5 text-slate-300 hover:text-white rounded-xl gap-2 h-10"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl gap-2 h-10 px-5 shadow-lg shadow-blue-600/20">
            <Download size={16} />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden hover:border-white/10 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.change}
                  {stat.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weekly Attendance Chart */}
        <Card className="lg:col-span-2 border-white/5 bg-card/40 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-lg font-bold text-white">Weekly Attendance Trend</CardTitle>
              <CardDescription className="text-slate-400">Percentage of present students per day (last 7 days)</CardDescription>
            </div>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option>Last 7 Days</option>
              <option disabled>Last 30 Days</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-stretch justify-between gap-3 px-2 pb-2">
              {weeklyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full flex-1 flex items-end group cursor-pointer">
                    {/* The Bar */}
                    <div 
                      className={`w-5 mx-auto rounded-t-full transition-all duration-500 ease-out group-hover:brightness-110 ${
                        data.rate > 90 ? 'bg-emerald-700 shadow-[0_0_10px_rgba(4,120,87,0.2)]' : 
                        data.rate > 70 ? 'bg-emerald-800' : 
                        data.rate > 0 ? 'bg-emerald-900' : 'bg-white/5'
                      }`}
                      style={{ height: `${Math.max(data.rate, 4)}%` }}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 bg-slate-800 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg border border-white/10 whitespace-nowrap z-20 pointer-events-none shadow-2xl">
                      {data.rate}%
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-white/10" />
                    </div>
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{data.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Department Overview</CardTitle>
            <CardDescription className="text-slate-400">Student enrollment by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {departments.length > 0 ? departments.map((dept, i) => {
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"];
              const color = colors[i % colors.length];
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-300">{dept.name}</span>
                    <span className="font-bold text-white">{dept.count}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} rounded-full`} 
                      style={{ width: `${(dept.count / totalStudents) * 100}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Users size={40} className="mb-2 opacity-20" />
                <p className="text-sm">No department data available</p>
              </div>
            )}
            
            {departments.length > 0 && (
              <div className="pt-4 mt-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <AlertCircle size={18} className="text-blue-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-blue-200/80 leading-relaxed">
                    Data reflects currently registered students across <span className="font-bold text-blue-300">{departments.length}</span> departments.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

