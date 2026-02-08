"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AttendanceList from "@/components/AttendanceList"
import WebcamFeed from "@/components/WebcamFeed"

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [attendance, setAttendance] = useState<string[]>([])

  const startAttendance = () => {
    setIsRecording(true)
    // Simulate attendance logging
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString()
      setAttendance((prev) => [...prev, `Attendance logged at ${timestamp}`])
    }, 5000) // Log every 5 seconds

    // Stop after 30 seconds (for demo purposes)
    setTimeout(() => {
      clearInterval(interval)
      setIsRecording(false)
    }, 30000)
  }

  const stopAttendance = () => {
    setIsRecording(false)
  }

  return (
    <div className="container mx-auto p-2 space-y-1">
      <h1 className="text-3xl font-bold text-center mb-2">Facial Recognition Attendance System</h1>

      <div className="grid md:grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Camera Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <WebcamFeed />
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={startAttendance} disabled={isRecording} className="bg-green-500 hover:bg-green-600">
                Start Attendance
              </Button>
              <Button onClick={stopAttendance} disabled={!isRecording} className="bg-red-500 hover:bg-red-600">
                Stop Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance Log</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceList attendance={attendance} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
