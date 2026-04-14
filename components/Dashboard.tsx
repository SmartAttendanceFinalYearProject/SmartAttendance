import { Users, UserCheck, UserX, Clock } from "lucide-react"

interface DashboardProps {
  totalStudents: number
  presentStudents: number
  absentStudents: number
  lastUpdateTime: string
}

export default function Dashboard({ totalStudents, presentStudents, absentStudents, lastUpdateTime }: DashboardProps) {
  const attendanceRate = totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : "0.0"
  const absentRate = totalStudents > 0 ? ((absentStudents / totalStudents) * 100).toFixed(1) : "0.0"

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Total Students</span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 border border-slate-200">
            <Users size={15} className="text-slate-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground tracking-tight">{totalStudents}</div>
        <p className="text-xs text-muted-foreground mt-1">Registered this session</p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Present</span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200">
            <UserCheck size={15} className="text-emerald-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground tracking-tight">{presentStudents}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <span className="text-xs text-emerald-600 font-medium">{attendanceRate}%</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Absent</span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 border border-red-200">
            <UserX size={15} className="text-red-500" />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground tracking-tight">{absentStudents}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-red-400 transition-all duration-500"
              style={{ width: `${absentRate}%` }}
            />
          </div>
          <span className="text-xs text-red-500 font-medium">{absentRate}%</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Last Update</span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 border border-blue-200">
            <Clock size={15} className="text-blue-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-foreground tracking-tight leading-none mt-1">
          {lastUpdateTime === "-" ? (
            <span className="text-muted-foreground text-xl">—</span>
          ) : (
            lastUpdateTime
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Auto-refreshes every 30s</p>
      </div>
    </div>
  )
}

