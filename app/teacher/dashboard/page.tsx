"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import { ListChecks, BookOpen, Users, Calendar, Clock, ChevronRight, FileSpreadsheet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { utils, writeFile } from "xlsx"

const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  loading: () => <div className="h-32 w-full animate-pulse bg-white/5 rounded-2xl" />,
  ssr: false
})

const AttendanceList = dynamic(() => import("@/components/AttendanceList"), {
  loading: () => <div className="h-64 w-full animate-pulse bg-white/5 rounded-2xl" />,
  ssr: false
})

import { generateScheduledSessions, type DaySchedule } from "@/lib/session-utils"

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
  recognized?: boolean;
}

interface AttendanceSession {
  id: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
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
  start_date: string;
  end_date: string;
  schedule: { schedule: DaySchedule[] };
}


export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("")
  const prevClassIdRef = useRef<string | null>(null)

  const handleExportExcel = () => {
    if (!selectedClass || selectedClass.attendance_sessions.length === 0) return;

    // 1. Prepare Sessions (Columns) - Sort by date
    const sortedSessions = [...selectedClass.attendance_sessions].sort((a, b) => 
      new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    // 2. Prepare Rows (Students)
    const data = selectedClass.student_details.map(student => {
      const row: Record<string, string | number> = {
        "Student Name": student.fullName,
        "Student ID": student.studentID
      };

      let presentCount = 0;
      sortedSessions.forEach((session) => {
        const record = session.records.find(r => 
          r.student_id === student.id || r.student_id === student.studentID
        );
        
        const status = record ? record.status : "absent"; // If no record, they were absent or pending
        if (status === 'present') presentCount++;
        
        const dateStr = new Date(session.session_date).toLocaleDateString();
        const timeStr = session.start_time ? ` (${session.start_time})` : "";
        const columnHeader = `${dateStr}${timeStr}`;
        
        row[columnHeader] = status.toUpperCase();
      });

      row["Total Present"] = presentCount;
      row["Total Sessions"] = sortedSessions.length;
      row["Attendance %"] = ((presentCount / sortedSessions.length) * 100).toFixed(1) + "%";

      return row;
    });

    // 3. Create Workbook & Worksheet
    const worksheet = utils.json_to_sheet(data);
    
    // Set column widths for better readability
    const wscols = [
      { wch: 25 }, // Student Name
      { wch: 15 }, // Student ID
      ...sortedSessions.map(() => ({ wch: 15 })), // Session columns
      { wch: 15 }, // Total Present
      { wch: 15 }, // Total Sessions
      { wch: 15 }, // Attendance %
    ];
    worksheet["!cols"] = wscols;

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Attendance Report");

    // 4. Download file
    const fileName = `${selectedClass.class_name.replace(/[^a-z0-9]/gi, '_')}_Full_Attendance_Report.xlsx`;
    writeFile(workbook, fileName);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) return
        const response = await fetch("http://127.0.0.1:8000/teacher/classes", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (!response.ok) throw new Error("Failed to fetch classes")
        const data = await response.json()
        setClasses(data)
        
        setSelectedClass(prev => {
          if (!prev && data.length > 0) return data[0];
          if (prev) {
            const updated = data.find((c: Class) => c.id === prev.id);
            return updated || data[0];
          }
          return null;
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load classes")
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
    const interval = setInterval(fetchClasses, 10000) // Auto-refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const scheduledSessions = useMemo(() => {
    if (!selectedClass) return [];
    return generateScheduledSessions(
      selectedClass.start_date,
      selectedClass.end_date,
      selectedClass.schedule.schedule
    );
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && scheduledSessions.length > 0) {
      // Only set the default tab if the class ID has changed or if no tab is active
      if (selectedClass.id !== prevClassIdRef.current || !activeTab) {
        const lastRecordedSession = [...selectedClass.attendance_sessions].sort((a, b) => 
          new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
        )[0];

        const defaultVal = lastRecordedSession 
          ? `session-${new Date(lastRecordedSession.session_date).toISOString().split('T')[0]}-${lastRecordedSession.start_time?.replace(/[^a-zA-Z0-9]/g, '') || ''}`
          : scheduledSessions[0].id;
        
        setActiveTab(defaultVal);
        prevClassIdRef.current = selectedClass.id;
      }
    }
  }, [selectedClass, scheduledSessions, activeTab]);

  const currentSessionData = useMemo(() => {
    if (!selectedClass || !activeTab) return null;
    
    return selectedClass.attendance_sessions.find(r => {
      const rDateStr = new Date(r.session_date).toISOString().split('T')[0];
      const rTimeKey = r.start_time?.replace(/[^a-zA-Z0-9]/g, '') || '';
      
      if (activeTab === `session-${rDateStr}-${rTimeKey}`) return true;
      
      const sched = scheduledSessions.find(s => s.id === activeTab);
      if (sched) {
        const sDateStr = new Date(sched.date).toISOString().split('T')[0];
        const sTimeKey = sched.startTime.replace(/[^a-zA-Z0-9]/g, '');
        return rDateStr === sDateStr && rTimeKey === sTimeKey;
      }
      
      return false;
    });
  }, [selectedClass, activeTab, scheduledSessions]);

  const stats = useMemo(() => {
    const total = selectedClass?.student_count || 0;
    if (!currentSessionData) return { total, present: 0, absent: 0, lastUpdate: "Attendance Pending" };
    
    const filtered = currentSessionData.records.filter((r: AttendanceRecord) => 
      r.full_name && 
      r.full_name.toLowerCase() !== "unknown" && 
      !r.full_name.toLowerCase().includes("not registered") &&
      r.student_id && r.student_id.toLowerCase() !== "unknown"
    );

    const present = filtered.filter(r => r.status === 'present' || r.recognized === true).length;
    const absent = filtered.filter(r => r.status === 'absent' && r.recognized !== true).length;
    
    // Use actual record timestamp instead of scheduled session date
    const actualRecord = currentSessionData.records.find((r: AttendanceRecord) => r.status === 'present') || currentSessionData.records[0];
    const lastUpdate = actualRecord 
      ? new Date(actualRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
      : "Attendance Pending";

    return { total, present, absent, lastUpdate };
  }, [selectedClass, currentSessionData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="h-10 w-72 bg-white/10 rounded-2xl" />
            <div className="h-4 w-96 bg-white/5 rounded-lg" />
          </div>
          <div className="flex gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 w-40 bg-white/5 border border-white/10 rounded-[1.25rem]" />
            ))}
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-[2rem] border border-white/10 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-white/10 rounded-2xl" />
                <div className="w-4 h-4 bg-white/5 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-white/5 rounded" />
                <div className="h-6 w-12 bg-white/10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-white/10 rounded-lg" />
                  <div className="h-3 w-24 bg-white/5 rounded" />
                </div>
              </div>
              
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-14 w-full bg-white/5 border border-white/5 rounded-2xl" />
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <div className="h-3 w-32 bg-white/10 rounded" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-3 w-28 bg-white/10 rounded" />
                          <div className="h-2 w-16 bg-white/5 rounded" />
                        </div>
                      </div>
                      <div className="w-4 h-4 bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-full min-h-[600px]">
              <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <div className="h-6 w-48 bg-white/10 rounded-lg" />
                <div className="h-6 w-32 bg-blue-500/10 rounded-full" />
              </div>
              
              <div className="p-8 space-y-8">
                {/* Tabs List Skeleton */}
                <div className="flex gap-3 overflow-hidden">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 w-32 bg-white/5 border border-white/10 rounded-2xl flex-shrink-0" />
                  ))}
                </div>

                {/* Session Header Skeleton */}
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] flex justify-between items-center">
                  <div className="space-y-3">
                    <div className="h-6 w-64 bg-white/10 rounded-lg" />
                    <div className="h-3 w-48 bg-white/5 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-white/10 rounded-full" />
                    <div className="h-8 w-24 bg-white/10 rounded-full" />
                  </div>
                </div>

                {/* List Skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 w-full bg-white/5 rounded-2xl border border-white/5" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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

  const totalStudents = stats.total
  const presentStudents = stats.present
  const absentStudents = stats.absent
  const lastUpdateTime = stats.lastUpdate

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
            absentStudents={absentStudents}
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

            {/* Right: Attendance Logs - Scheduled Sessions */}
            <div className="lg:col-span-8">
              <div className="rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full">
                <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ListChecks size={18} className="text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Attendance History</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {selectedClass.attendance_sessions.length > 0 && (
                      <>
                        <button
                          onClick={handleExportExcel}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                        >
                          <FileSpreadsheet size={14} />
                          Export All Sessions
                        </button>
                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                          {selectedClass.attendance_sessions.length} SESSIONS RECORDED
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1">
                  {(() => {
                    if (scheduledSessions.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 mb-4">
                            <Calendar size={28} className="text-slate-600" />
                          </div>
                          <h4 className="text-white font-bold mb-1">No Scheduled Sessions</h4>
                          <p className="text-sm text-slate-400 text-center max-w-xs">
                            Please check the class start and end dates.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="mb-8 overflow-x-auto pb-4 scrollbar-thin">
                          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto flex-nowrap w-max gap-2">
                            {scheduledSessions.map((session, idx) => {
                              const sessionDateStr = new Date(session.date).toISOString().split('T')[0];
                              const record = selectedClass.attendance_sessions.find(r => {
                                const rDateStr = new Date(r.session_date).toISOString().split('T')[0];
                                const dateMatch = rDateStr === sessionDateStr;
                                
                                // If we have time info, use it for better matching
                                if (r.start_time && r.end_time) {
                                  return dateMatch && 
                                         r.start_time === session.startTime && 
                                         r.end_time === session.endTime;
                                }
                                return dateMatch;
                              });
                              const isRecorded = !!record;

                              const tabValue = `session-${sessionDateStr}-${session.startTime.replace(/[^a-zA-Z0-9]/g, '')}`;

                              return (
                                <TabsTrigger 
                                  key={session.id} 
                                  value={tabValue}
                                  className="rounded-xl px-5 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all flex flex-col items-center min-w-[120px]"
                                >
                                  <span className="text-[10px] font-black uppercase opacity-50 mb-1">Session {idx + 1}</span>
                                  <span className="text-sm font-bold whitespace-nowrap">
                                    {new Date(session.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                  <div className="mt-2 flex items-center gap-1.5">
                                    {isRecorded ? (
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                    )}
                                    <span className={`text-[9px] font-bold uppercase ${isRecorded ? 'text-emerald-400' : 'text-slate-500'}`}>
                                      {isRecorded ? 'Completed' : 'Pending'}
                                    </span>
                                  </div>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                        </div>

                        {scheduledSessions.map((session) => {
                          const sessionDateStr = new Date(session.date).toISOString().split('T')[0];
                          const record = selectedClass.attendance_sessions.find(r => {
                            const rDateStr = new Date(r.session_date).toISOString().split('T')[0];
                            const dateMatch = rDateStr === sessionDateStr;
                            
                            if (r.start_time && r.end_time) {
                              return dateMatch && 
                                     r.start_time === session.startTime && 
                                     r.end_time === session.endTime;
                            }
                            return dateMatch;
                          });

                          const tabValue = `session-${sessionDateStr}-${session.startTime.replace(/[^a-zA-Z0-9]/g, '')}`;

                          // Filter out unknown students
                          const filteredRecords = record ? record.records.filter((r: AttendanceRecord) => 
                            r.full_name && 
                            r.full_name.toLowerCase() !== "unknown" && 
                            !r.full_name.toLowerCase().includes("not registered") &&
                            r.student_id && r.student_id.toLowerCase() !== "unknown"
                          ) : [];

                          const presentCount = filteredRecords.filter((r: AttendanceRecord) => r.status === 'present' || r.recognized === true).length;
                          const absentCount = filteredRecords.filter((r: AttendanceRecord) => r.status === 'absent' && r.recognized !== true).length;

                          return (
                            <TabsContent key={session.id} value={tabValue} className="mt-0 outline-none animate-in fade-in duration-500">
                              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/5 p-6 rounded-[2rem]">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={16} className="text-blue-400" />
                                    <h4 className="text-lg font-bold text-white">{session.label}</h4>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={12} className="text-slate-500" />
                                      <span className="text-xs text-slate-400">Scheduled: {session.startTime} – {session.endTime}</span>
                                    </div>
                                    {record && (
                                      <>
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-slate-400">Recorded: {new Date(record.session_date).toLocaleTimeString()}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {record ? (
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                      {presentCount} Present
                                    </div>
                                    <div className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                                      {absentCount} Absent
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs font-bold text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                    Attendance Pending
                                  </div>
                                )}
                              </div>
                              
                              {record ? (
                                <div className="rounded-[2rem] border border-white/5 bg-black/20 overflow-hidden shadow-inner">
                                  <AttendanceList records={filteredRecords.map(r => ({
                                    ...r,
                                    status: (r.status === 'present' || r.recognized === true) ? 'present' : 'absent'
                                  }))} />
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                                    <ListChecks size={28} className="text-slate-600" />
                                  </div>
                                  <h4 className="text-white font-bold mb-1">No Attendance Data</h4>
                                  <p className="text-sm text-slate-400 text-center max-w-xs">
                                    This session is scheduled for {new Date(session.date).toLocaleDateString()}. Go to the scanner to take attendance.
                                  </p>
                                </div>
                              )}
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    );
                  })()}
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
