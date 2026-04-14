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

      <div className="space-y-5">
        <Dashboard
          totalStudents={totalStudents}
          presentStudents={presentStudents}
          absentStudents={totalStudents - presentStudents}
          lastUpdateTime={lastUpdateTime}
        />

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <ListChecks size={14} className="text-muted-foreground" />
              <span className="text-sm font-medium">Attendance Records</span>
            </div>
            {attendance.length > 0 && (
              <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {attendance.length} entries
              </span>
            )}
          </div>
          <AttendanceList attendance={attendance} />
        </div>
      </div>
    </div>
  )
}

