"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Play, Square, Camera, ListChecks, BookOpen, Loader2, Image as ImageIcon } from "lucide-react"

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

interface RecognitionRow {
  student_id: string
  full_name?: string
  status?: string
  timestamp?: string
  emotion?: string
  pose?: string
  recognized?: boolean
}

export default function TeacherScannerPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [records, setRecords] = useState<ScannerRecord[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalSuccess, setApprovalSuccess] = useState(false)
  const webcamRef = useRef<WebcamCaptureRef | null>(null)

  const selectedClass = classes.find(c => c.id === selectedClassId)
  
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

  const captureAndRecognize = async (fileOrEvent?: File | React.MouseEvent) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : undefined;
    const currentSession = sessions.find(s => s.id === selectedSessionId)
    if (!selectedClassId || !currentSession) {
      if (!selectedSessionId) alert("Please select a session first")
      return
    }

    setIsProcessing(true)
    try {
      let imageBlob: Blob;
      let filename: string;

      if (file) {
        imageBlob = file;
        filename = file.name;
      } else {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot()
        if (!imageSrc) return
        
        // Manual conversion of base64 to Blob to ensure compatibility
        const byteString = atob(imageSrc.split(',')[1]);
        const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        imageBlob = new Blob([ab], { type: mimeString });
        filename = "attendance.jpg"
      }
      
      const formData = new FormData()
      formData.append("file", imageBlob, filename)
      formData.append("class_id", selectedClassId)
      // Send session info to prevent overwriting
      formData.append("session_date", currentSession.date)
      formData.append("start_time", currentSession.startTime)
      formData.append("end_time", currentSession.endTime)

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
        setRecords(prev => {
          const newRecords = [...prev];
          // Only process results that are successfully recognized
          const recognizedResults = (result.results || []).filter((r: RecognitionRow) => r.recognized === true);
          
          recognizedResults.forEach((newR: RecognitionRow) => {
            const idx = newRecords.findIndex(r => r.student_id === newR.student_id);
            
            if (idx >= 0) {
              // Only update if not already marked present, or to update latest emotion/pose
              newRecords[idx] = { 
                ...newRecords[idx], 
                ...(newR as ScannerRecord),
                status: "present",
                timestamp: newR.timestamp || new Date().toISOString()
              };
            }
            // Note: If the person is recognized but NOT in the roster (idx < 0), 
            // they are ignored and not displayed in the frontend.
          });
          return newRecords;
        });
      }
    } catch (err) {
      console.error("Recognition failed:", err)
    } finally {
      setIsProcessing(false)
    }
  }

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

  const startAttendance = () => {
    if (!selectedClassId || !selectedSessionId || !selectedClass) return
    setIsRecording(true)
    setApprovalSuccess(false)
  }

  const stopAttendance = () => {
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
                {/* Photo Import Icon */}
                <div className="absolute top-4 right-4 z-20">
                  <label className="cursor-pointer p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white hover:bg-blue-600 hover:border-blue-500 transition-all backdrop-blur-md shadow-2xl flex items-center justify-center group" title="Import image from files">
                    <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) captureAndRecognize(file)
                        e.target.value = "" // Reset to allow re-uploading same file
                      }}
                    />
                  </label>
                </div>

                <Webcam
                  audio={false}
                  ref={webcamRef as React.RefObject<WebcamCaptureRef>}
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
                  onClick={() => captureAndRecognize()}
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
