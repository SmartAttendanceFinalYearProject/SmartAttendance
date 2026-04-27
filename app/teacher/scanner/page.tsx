"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import AttendanceList from "@/components/AttendanceList"
import Webcam from "react-webcam"
import { Play, Square, Camera, ListChecks, BookOpen, Loader2, AlertCircle } from "lucide-react"

interface Class {
  id: string;
  class_name: string;
  subject_name: string;
}

export default function TeacherScannerPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [records, setRecords] = useState<any[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const webcamRef = useRef<any>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch("http://127.0.0.1:8000/teacher/classes", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (!response.ok) throw new Error("Failed to fetch classes")
        const data = await response.json()
        setClasses(data)
        if (data.length > 0) {
          setSelectedClassId(data[0].id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingClasses(false)
      }
    }
    fetchClasses()
  }, [])

  const captureAndRecognize = async () => {
    if (!webcamRef.current || !selectedClassId) return

    setIsProcessing(true)
    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) return

      // Convert base64 to blob
      const res = await fetch(imageSrc)
      const blob = await res.blob()
      
      const formData = new FormData()
      formData.append("file", blob, "attendance.jpg")
      formData.append("class_id", selectedClassId)

      const token = localStorage.getItem("access_token")
      const response = await fetch("http://127.0.0.1:8000/attendance/recognize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()
      if (result.status === "success") {
        setRecords(result.results)
      }
    } catch (err) {
      console.error("Recognition failed:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const startAttendance = () => {
    if (!selectedClassId) return
    setIsRecording(true)
    // In a real app, you might want to pulse every X seconds
    const interval = setInterval(captureAndRecognize, 5000)
    ;(window as any).attendanceInterval = interval
  }

  const stopAttendance = () => {
    setIsRecording(false)
    if ((window as any).attendanceInterval) {
      clearInterval((window as any).attendanceInterval)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Attendance Scanner
            </h1>
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Live Session</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            Position the camera to cover the classroom. The system will automatically detect and recognize students.
          </p>
        </div>

        <div className="flex flex-col gap-2 min-w-[240px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Active Class</label>
          {loadingClasses ? (
            <div className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={isRecording}
              className="bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all cursor-pointer"
            >
              {classes.length === 0 && <option value="">No classes assigned</option>}
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.subject_name})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-white">Live Classroom Feed</span>
              </div>
              <div className="flex items-center gap-2">
                {isProcessing && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${
                  isRecording
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-500 bg-white/5 border-white/10"
                }`}>
                  {isRecording ? "Processing" : "Standby"}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="w-full h-full object-cover"
                />
                {!isRecording && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                      <Camera size={32} className="text-slate-500" />
                    </div>
                    <h4 className="text-white font-bold mb-2">Camera Ready</h4>
                    <p className="text-sm text-slate-400 max-w-xs">Select a class and click start to begin recording attendance</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center items-center gap-4 mt-8">
                {!isRecording ? (
                  <Button
                    onClick={startAttendance}
                    disabled={!selectedClassId}
                    className="h-14 bg-blue-600 hover:bg-blue-500 text-white font-black gap-3 px-10 shadow-xl shadow-blue-600/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
                  >
                    <Play size={18} fill="currentColor" />
                    Start Session
                  </Button>
                ) : (
                  <Button
                    onClick={stopAttendance}
                    className="h-14 bg-rose-600 hover:bg-rose-500 text-white font-black gap-3 px-10 shadow-xl shadow-rose-600/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
                  >
                    <Square size={18} fill="currentColor" />
                    End Session
                  </Button>
                )}
                
                <Button
                  onClick={captureAndRecognize}
                  disabled={!isRecording || isProcessing}
                  variant="outline"
                  className="h-14 border-white/10 bg-white/5 text-white font-bold gap-3 px-8 rounded-2xl hover:bg-white/10 disabled:opacity-50 transition-all"
                >
                  <Camera size={18} />
                  Snapshot
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden h-full flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <ListChecks size={16} className="text-blue-400" />
                <span className="text-sm font-bold text-white">Real-time Detection</span>
              </div>
              {records.length > 0 && (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {records.filter(r => r.status === 'present').length} IDENTIFIED
                </span>
              )}
            </div>
            <div className="flex-1">
              <AttendanceList records={records} />
            </div>
            

          </div>
        </div>
      </div>
    </div>
  )
}
