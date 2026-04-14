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
      <div className="rounded-2xl border border-white/5 bg-card p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-semibold text-slate-400">Total Students</span>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/5">
            <Users size={16} className="text-blue-400" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight">{totalStudents}</div>
        <p className="text-xs font-medium text-slate-500 mt-1.5 uppercase tracking-wider">Registered</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-semibold text-slate-400">Present</span>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <UserCheck size={16} className="text-emerald-400" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight">{presentStudents}</div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-700"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <span className="text-xs text-emerald-400 font-bold">{attendanceRate}%</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-semibold text-slate-400">Absent</span>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20">
            <UserX size={16} className="text-red-400" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white tracking-tight">{absentStudents}</div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all duration-700"
              style={{ width: `${absentRate}%` }}
            />
          </div>
          <span className="text-xs text-red-400 font-bold">{absentRate}%</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-semibold text-slate-400">Last Update</span>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Clock size={16} className="text-blue-400" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight leading-none mt-1">
          {lastUpdateTime === "-" ? (
            <span className="text-slate-600 font-medium tracking-widest">---</span>
          ) : (
            lastUpdateTime
          )}
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Auto-refresh Active</p>
      </div>
    </div>
  )
}

