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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 recording-indicator inline-block" />
              <span className="text-xs font-semibold text-red-400">Recording</span>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-400">
          Start the camera to begin automatic facial recognition attendance
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/5 bg-card shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-slate-400" />
                <span className="text-sm font-semibold text-white">Live Camera Feed</span>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                isRecording
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-slate-500 bg-white/5 border-white/5"
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 px-6 shadow-lg shadow-emerald-500/20 rounded-xl disabled:opacity-50"
                >
                  <Play size={14} fill="currentColor" />
                  Start Attendance
                </Button>
                <Button
                  onClick={stopAttendance}
                  disabled={!isRecording}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 gap-2 px-6 rounded-xl disabled:opacity-40"
                >
                  <Square size={14} fill="currentColor" />
                  Stop Recording
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/5 bg-card shadow-2xl overflow-hidden h-full flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <ListChecks size={14} className="text-slate-400" />
                <span className="text-sm font-semibold text-white">Attendance Log</span>
              </div>
              {attendance.length > 0 && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {attendance.length} PRESENT
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
