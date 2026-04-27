"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/Dashboard"
import AttendanceList from "@/components/AttendanceList"
import { ListChecks, BookOpen, Users, Calendar, Clock, ChevronRight, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Student {
  id: string;
  fullName: string;
  studentID: string;
}

interface AttendanceRecord {
  student_id: string;
  full_name: string;
  status: string;
  emotion?: string;
  pose?: string;
  timestamp: string;
}

interface AttendanceSession {
  id: string;
  session_date: string;
  records: AttendanceRecord[];
}

interface Class {
  id: string;
  class_name: string;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  student_count: number;
  student_details: Student[];
  attendance_sessions: AttendanceSession[];
}

export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("http://127.0.0.1:8000/teacher/classes", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (!response.ok) throw new Error("Failed to fetch classes")
        const data = await response.json()
        setClasses(data)
        if (data.length > 0) {
          setSelectedClass(data[0])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Loading your classes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-rose-400 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totalStudents = selectedClass?.student_count || 0
  const latestSession = selectedClass?.attendance_sessions?.length 
    ? selectedClass.attendance_sessions[selectedClass.attendance_sessions.length - 1] 
    : null
  
  const presentStudents = latestSession 
    ? latestSession.records.filter(r => r.status === 'present').length 
    : 0

  const lastUpdateTime = latestSession 
    ? new Date(latestSession.session_date).toLocaleTimeString() 
    : "No records yet"

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Manage your assigned classes, track student progress, and monitor real-time attendance analytics.
          </p>
        </div>
        
        {/* Class Selector Dropdown/Cards */}
        <div className="flex flex-wrap gap-3">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`px-5 py-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                selectedClass?.id === cls.id
                  ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${selectedClass?.id === cls.id ? 'bg-white/20' : 'bg-white/5'}`}>
                <BookOpen size={16} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 leading-none mb-1">Class</p>
                <p className="text-sm font-bold truncate max-w-[120px]">{cls.class_name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedClass ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Quick Stats */}
          <Dashboard
            totalStudents={totalStudents}
            presentStudents={presentStudents}
            absentStudents={totalStudents - presentStudents}
            lastUpdateTime={lastUpdateTime}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Class Info & Students */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <BookOpen className="text-indigo-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedClass.subject_name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedClass.subject_code}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Users size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-300">Total Students</span>
                    </div>
                    <span className="text-sm font-bold text-white">{selectedClass.student_count}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-300">Sessions Logged</span>
                    </div>
                    <span className="text-sm font-bold text-white">{selectedClass.attendance_sessions.length}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={12} /> Registered Students
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {selectedClass.student_details.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{student.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{student.studentID}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Attendance Logs with Tabs */}
            <div className="lg:col-span-8">
              <div className="rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full">
                <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ListChecks size={18} className="text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Attendance History</h3>
                  </div>
                  {selectedClass.attendance_sessions.length > 0 && (
                    <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {selectedClass.attendance_sessions.length} SESSIONS RECORDED
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1">
                  {selectedClass.attendance_sessions.length > 0 ? (
                    <Tabs defaultValue={selectedClass.attendance_sessions[selectedClass.attendance_sessions.length - 1].id} className="w-full">
                      <div className="mb-6 overflow-x-auto pb-2 scrollbar-thin">
                        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto flex-nowrap w-max">
                          {selectedClass.attendance_sessions.map((session, idx) => (
                            <TabsTrigger 
                              key={session.id} 
                              value={session.id}
                              className="rounded-xl px-4 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[10px] font-bold uppercase opacity-60">Session {idx + 1}</span>
                                <span className="text-xs font-semibold whitespace-nowrap">
                                  {new Date(session.session_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </TabsTrigger>
                          )).reverse()}
                        </TabsList>
                      </div>

                      {selectedClass.attendance_sessions.map((session) => (
                        <TabsContent key={session.id} value={session.id} className="mt-0 outline-none animate-in fade-in duration-500">
                          <div className="mb-4 flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-500" />
                                <span className="text-xs text-slate-400">
                                  {new Date(session.session_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-500" />
                                <span className="text-xs text-slate-400">
                                  {new Date(session.session_date).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs font-medium text-slate-400">
                              <span className="text-emerald-400 font-bold">{session.records.filter(r => r.status === 'present').length}</span> present / <span className="text-rose-400 font-bold">{session.records.filter(r => r.status === 'absent').length}</span> absent
                            </div>
                          </div>
                          <AttendanceList records={session.records} />
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 mb-4">
                        <Calendar size={28} className="text-slate-600" />
                      </div>
                      <h4 className="text-white font-bold mb-1">No Attendance Sessions</h4>
                      <p className="text-sm text-slate-400 text-center max-w-xs">
                        Once you start recording attendance for this class, history will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
            <BookOpen className="text-blue-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Classes Assigned</h2>
          <p className="text-slate-400 max-w-md">
            It looks like you don&apos;t have any classes assigned to you yet. Please contact the administrator to get started.
          </p>
        </div>
      )}
    </div>
  )
}
