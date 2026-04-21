"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("This Week")

  const stats = [
    {
      title: "Average Attendance",
      value: "94.2%",
      change: "+2.5%",
      isPositive: true,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Total Students",
      value: "1,284",
      change: "+12",
      isPositive: true,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Late Arrivals",
      value: "4.8%",
      change: "-1.2%",
      isPositive: true, // Lower is better for late arrivals
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      title: "Active Teachers",
      value: "42",
      change: "0",
      isPositive: true,
      icon: CheckCircle2,
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    }
  ]

  const weeklyData = [
    { day: "Mon", rate: 92 },
    { day: "Tue", rate: 95 },
    { day: "Wed", rate: 88 },
    { day: "Thu", rate: 94 },
    { day: "Fri", rate: 91 },
    { day: "Sat", rate: 75 },
    { day: "Sun", rate: 0 }
  ]

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
          <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:text-white rounded-xl gap-2 h-10">
            <Filter size={16} />
            Filters
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
              <CardDescription className="text-slate-400">Percentage of present students per day</CardDescription>
            </div>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4">
              {weeklyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div className="relative w-full group">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-125 ${
                        data.rate > 90 ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 
                        data.rate > 70 ? 'bg-blue-500/60' : 'bg-slate-700'
                      }`}
                      style={{ height: `${data.rate}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded border border-white/10 whitespace-nowrap">
                      {data.rate}%
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{data.day}</span>
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
            {[
              { name: "Computer Science", count: 420, color: "bg-blue-500" },
              { name: "Engineering", count: 350, color: "bg-emerald-500" },
              { name: "Information Technology", count: 280, color: "bg-purple-500" },
              { name: "Business Admin", count: 234, color: "bg-amber-500" }
            ].map((dept, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-300">{dept.name}</span>
                  <span className="font-bold text-white">{dept.count}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${dept.color} rounded-full`} 
                    style={{ width: `${(dept.count / 1284) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-4 mt-4 border-t border-white/5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-200/80 leading-relaxed">
                  Low attendance detected in <span className="font-bold text-amber-300">Section B</span> of Computer Science.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
