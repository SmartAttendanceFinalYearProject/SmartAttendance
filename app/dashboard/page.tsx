"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/Dashboard"
import AttendanceList from "@/components/AttendanceList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const [totalStudents, setTotalStudents] = useState(50) // Example total
  const [presentStudents, setPresentStudents] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState("-")
  const [attendance, setAttendance] = useState<string[]>([])

  useEffect(() => {
    // Simulate fetching data
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
    const interval = setInterval(fetchData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Attendance Dashboard</h1>

      <Dashboard
        totalStudents={totalStudents}
        presentStudents={presentStudents}
        absentStudents={totalStudents - presentStudents}
        lastUpdateTime={lastUpdateTime}
      />

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceList attendance={attendance} />
        </CardContent>
      </Card>
    </div>
  )
}

