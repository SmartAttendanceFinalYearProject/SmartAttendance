"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import AttendanceList from "@/components/AttendanceList"
import WebcamFeed from "@/components/WebcamFeed"
import { Play, Square, Camera, ListChecks } from "lucide-react"

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [attendance, setAttendance] = useState<string[]>([])

  const startAttendance = () => {
    setIsRecording(true)
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString()
      setAttendance((prev) => [...prev, `Attendance logged at ${timestamp}`])
    }, 5000)

    setTimeout(() => {
      clearInterval(interval)
      setIsRecording(false)
    }, 30000)
  }

  const stopAttendance = () => {
    setIsRecording(false)
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Attendance Scanner
          </h1>
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 recording-indicator inline-block" />
              <span className="text-xs font-medium text-red-600">Recording</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Start the camera to begin automatic facial recognition attendance
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">Live Camera Feed</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                isRecording
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-muted-foreground bg-muted border-border"
              }`}>
                {isRecording ? "Active" : "Standby"}
              </span>
            </div>
            <div className="p-5">
              <WebcamFeed />
              <div className="flex justify-center items-center gap-3 mt-5">
                <Button
                  onClick={startAttendance}
                  disabled={isRecording}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 px-5 shadow-sm disabled:opacity-50"
                >
                  <Play size={13} />
                  Start Attendance
                </Button>
                <Button
                  onClick={stopAttendance}
                  disabled={!isRecording}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2 px-5 disabled:opacity-40"
                >
                  <Square size={13} />
                  Stop
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <ListChecks size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">Attendance Log</span>
              </div>
              {attendance.length > 0 && (
                <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {attendance.length}
                </span>
              )}
            </div>
            <div className="flex-1 p-0">
              <AttendanceList attendance={attendance} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
