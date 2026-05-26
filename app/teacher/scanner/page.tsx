"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Play, Square, Camera, ListChecks, BookOpen, Loader2, Wifi } from "lucide-react"

const AttendanceList = dynamic(() => import("@/components/AttendanceList"), {
  loading: () => <div className="h-64 w-full animate-pulse bg-white/5 rounded-2xl" />,
  ssr: false
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Webcam = dynamic(() => import("react-webcam").then((mod) => mod.default as any), {
  loading: () => <div className="aspect-video w-full animate-pulse bg-black rounded-2xl" />,
  ssr: false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any


import { generateScheduledSessions, type DaySchedule } from "@/lib/session-utils"

interface Student {
  id: string;
  fullName: string;
  studentID: string;
}

interface Class {
  id: string;
  class_name: string;
  subject_name: string;
  start_date: string;
  end_date: string;
  schedule: { schedule: DaySchedule[] };
  student_details: Student[];
}

interface ScannerRecord {
  student_id: string
  full_name: string
  status: string
  timestamp: string
  emotion?: string
  pose?: string
}

/** Matches react-webcam imperative handle used by this page */
type WebcamCaptureRef = { getScreenshot: () => string | null }

export default function TeacherScannerPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [records, setRecords] = useState<ScannerRecord[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalSuccess, setApprovalSuccess] = useState(false)
  const webcamRef = useRef<WebcamCaptureRef | null>(null)

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const wsRef = useRef<WebSocket | null>(null)

  const sessions = useMemo(() => {
    if (!selectedClass) return []
    return generateScheduledSessions(
      selectedClass.start_date,
      selectedClass.end_date,
      selectedClass.schedule.schedule
    )
  }, [selectedClass])

  // Set default session to the one closest to today
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const today = new Date().setHours(0,0,0,0);
      const closest = sessions.reduce((prev, curr) => {
        const currDiff = Math.abs(new Date(curr.date).getTime() - today);
        const prevDiff = Math.abs(new Date(prev.date).getTime() - today);
        return currDiff < prevDiff ? curr : prev;
      });
      setSelectedSessionId(closest.id);
    }
  }, [sessions, selectedSessionId])

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

  // Initialize records when class is selected
  useEffect(() => {
    if (selectedClass) {
      const initialRecords = selectedClass.student_details.map(student => ({
        student_id: student.studentID,
        full_name: student.fullName,
        status: "absent",
        timestamp: new Date().toISOString()
      }))
      setRecords(initialRecords)
    } else {
      setRecords([])
    }
  }, [selectedClass])

const approveAttendance = async () => {
    const currentSession = sessions.find(s => s.id === selectedSessionId)
    if (!selectedClassId || !currentSession || records.length === 0) return

    setIsApproving(true)
    try {
      const formData = new FormData()
      formData.append("class_id", selectedClassId)
      formData.append("session_date", currentSession.date)
      formData.append("start_time", currentSession.startTime)
      formData.append("end_time", currentSession.endTime)
      formData.append("records_json", JSON.stringify(records))

      const token = localStorage.getItem("access_token")
      const response = await fetch("http://127.0.0.1:8000/attendance/approve", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()
      if (result.status === "success") {
        setApprovalSuccess(true)
        setTimeout(() => setApprovalSuccess(false), 3000)
      } else {
        alert("Approval failed: " + result.message)
      }
    } catch (err) {
      console.error("Approval failed:", err)
      alert("An error occurred during approval")
    } finally {
      setIsApproving(false)
    }
  }

// Holds the setInterval ID for the frame-sending loop
const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

const startLiveStream = () => {
  if (!selectedClassId || !selectedSessionId) {
    alert("Please select class and session first")
    return
  }

  setIsRecording(true)

  const token = localStorage.getItem("access_token")
  const ws = new WebSocket(`ws://127.0.0.1:8000/attendance/live?token=${token}`)

  ws.onopen = () => console.log("✅ Live stream connected")

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      // Backend signals it is ready → start sending frames
      if (data.status === "ready") {
        console.log("🟢 Backend ready – starting frame capture")
        frameIntervalRef.current = setInterval(() => {
          const wsNow = wsRef.current
          if (!wsNow || wsNow.readyState !== WebSocket.OPEN) return

          const screenshot = webcamRef.current?.getScreenshot()
          if (!screenshot) return

          wsNow.send(JSON.stringify({ image: screenshot }))
        }, 1000) // send one frame per second
        return
      }

      console.log("📡 Live data received:", data)

      if (data.results && Array.isArray(data.results)) {
        setRecords(prev => {
          // Track recognized student IDs in the current frame
          const recognizedIds = new Set<string>()
          const resultByStudentId = new Map<string, any>()

          data.results.forEach((res: any) => {
            if (res.recognized && res.student_id) {
              recognizedIds.add(res.student_id)
              resultByStudentId.set(res.student_id, res)
            }
          })

          return prev.map(record => {
            if (recognizedIds.has(record.student_id)) {
              const res = resultByStudentId.get(record.student_id)
              return {
                ...record,
                status: "present",
                emotion: res.emotion || "neutral",
                pose: res.pose || "standing",
                timestamp: new Date().toISOString()
              }
            } else {
              return {
                ...record,
                status: "absent",
                emotion: undefined,
                pose: undefined,
                timestamp: record.timestamp // keep the previous timestamp or reset to now
              }
            }
          })
        })
      }
    } catch (e) {
      console.error("Error parsing live data:", e)
    }
  }

  ws.onerror = (error) => console.error("WebSocket error:", error)
  ws.onclose = () => {
    console.log("Live stream closed")
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
    setIsRecording(false)
  }

  wsRef.current = ws
}

const stopLiveStream = () => {
  if (frameIntervalRef.current) {
    clearInterval(frameIntervalRef.current)
    frameIntervalRef.current = null
  }
  if (wsRef.current) {
    wsRef.current.close()
    wsRef.current = null
  }
  setIsRecording(false)
}

  if (loadingClasses) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="h-10 w-80 bg-white/10 rounded-2xl" />
            <div className="h-4 w-[450px] bg-white/5 rounded-lg" />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-20 bg-white/10 rounded ml-1" />
              <div className="h-14 w-60 bg-white/5 border border-white/10 rounded-2xl" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-20 bg-white/10 rounded ml-1" />
              <div className="h-14 w-72 bg-white/5 border border-white/10 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Camera Section Skeleton */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex justify-between">
                <div className="h-5 w-40 bg-white/10 rounded" />
                <div className="h-6 w-24 bg-white/5 rounded-full" />
              </div>
              <div className="p-8 space-y-8">
                <div className="aspect-video bg-white/5 rounded-3xl border border-white/5" />
                <div className="flex justify-center gap-4">
                  <div className="h-14 w-48 bg-blue-600/20 rounded-2xl border border-blue-500/20" />
                  <div className="h-14 w-36 bg-white/5 rounded-2xl border border-white/10" />
                </div>
              </div>
            </div>
          </div>

          {/* List Section Skeleton */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden h-full min-h-[550px]">
              <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex justify-between">
                <div className="h-5 w-48 bg-white/10 rounded" />
                <div className="h-6 w-32 bg-emerald-500/10 rounded-full" />
              </div>
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-16 w-full bg-white/5 rounded-2xl border border-white/5" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
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

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-2 min-w-[240px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Active Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setSelectedSessionId("") // Reset session when class changes
              }}
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
          </div>

          <div className="flex flex-col gap-2 min-w-[280px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Current Session</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={isRecording || !selectedClassId}
              className="bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all cursor-pointer"
            >
              {sessions.length === 0 && <option value="">No sessions available</option>}
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>



      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-white">Live Classroom Feed</span>
              </div>
              <div className="flex items-center gap-2">
              {isRecording && (
                  <Wifi size={14} className="text-emerald-400 animate-pulse" />
                )}
                <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${
                  isRecording
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-500 bg-white/5 border-white/10"
                }`}>
                  {isRecording ? "Live" : "Standby"}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black">
                <Webcam
                  audio={false}
                  ref={webcamRef as React.RefObject<WebcamCaptureRef>}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user"
                  }}
                  screenshotWidth={640}
                  screenshotHeight={480}
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
                  onClick={startLiveStream}
                  disabled={!selectedClassId || !selectedSessionId}
                  className="h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black gap-3 px-10"
                >
                  <Play size={18} /> Start Live Attendance
                </Button>
              ) : (
                <Button
                  onClick={stopLiveStream}
                  className="h-14 bg-rose-600 hover:bg-rose-500 text-white font-black gap-3 px-10"
                >
                  <Square size={18} /> Stop Live Session
                </Button>
              )}
            </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden h-full flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <ListChecks size={16} className="text-blue-400" />
                <span className="text-sm font-bold text-white">Real-time Detection</span>
              </div>
              {records.length > 0 && (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                  {records.filter(r => 
                    r.status === "present" &&
                    r.full_name && 
                    r.full_name.toLowerCase() !== "unknown" && 
                    !r.full_name.toLowerCase().includes("not registered")
                  ).length} IDENTIFIED
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <AttendanceList records={records} />
              </div>
              
              {records.length > 0 && !isRecording && (
                <div className="p-6 border-t border-white/5 bg-white/5 mt-auto">
                  <Button
                    onClick={approveAttendance}
                    disabled={isApproving || approvalSuccess}
                    className={`w-full h-14 font-black gap-3 shadow-xl rounded-2xl transition-all uppercase tracking-wider ${
                      approvalSuccess 
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white" 
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                    }`}
                  >
                    {isApproving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : approvalSuccess ? (
                      <ListChecks size={18} />
                    ) : (
                      <BookOpen size={18} />
                    )}
                    {isApproving ? "Saving..." : approvalSuccess ? "Attendance Saved!" : "Approve & Save Attendance"}
                  </Button>
                  {approvalSuccess && (
                    <p className="text-center text-[10px] text-emerald-400 font-bold mt-3 animate-bounce">
                      Attendance has been successfully recorded in the database.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}
