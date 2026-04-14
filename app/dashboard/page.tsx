"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/Dashboard"
import AttendanceList from "@/components/AttendanceList"
import { ListChecks } from "lucide-react"

export default function DashboardPage() {
  const [totalStudents] = useState(50)
  const [presentStudents, setPresentStudents] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState("-")
  const [attendance, setAttendance] = useState<string[]>([])

  useEffect(() => {
    const fetchData = () => {
      const newAttendance = Array.from({ length: Math.floor(Math.random() * 20) + 1 }, () => {
        const date = new Date()
        date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 60))
        return `Attendance logged at ${date.toLocaleTimeString()}`
      })
      setAttendance(newAttendance)
      setPresentStudents(newAttendance.length)
      setLastUpdateTime(new Date().toLocaleTimeString())
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Attendance Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of today&apos;s attendance across all registered students
        </p>
      </div>

      <div className="space-y-6">
        <Dashboard
          totalStudents={totalStudents}
          presentStudents={presentStudents}
          absentStudents={totalStudents - presentStudents}
          lastUpdateTime={lastUpdateTime}
        />

        <div className="rounded-2xl border border-white/5 bg-card shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-2">
              <ListChecks size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-white">Attendance Records</span>
            </div>
            {attendance.length > 0 && (
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {attendance.length} ENTRIES
              </span>
            )}
          </div>
          <AttendanceList attendance={attendance} />
        </div>
      </div>
    </div>
  )
}

