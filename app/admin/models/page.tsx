"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, GraduationCap, Layers3, Trash2, Pencil, Plus, X, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type Subject = { id: string; subject_name: string; subject_code: string }
type Teacher = { id: string; full_name: string; subject_id: string; username: string }
type Student = { id: string; fullName: string; studentID: string; batch?: string; class_year?: string; semester?: string; section?: string; department?: string }
type DaySchedule = { day: string; start_time: string; end_time: string }
type ClassItem = {
  id: string
  class_name: string
  subject_id: string
  teacher_id: string
  teacher_name: string
  start_date: string
  end_date: string
  schedule: { schedule: DaySchedule[] }
  student_count: number
  students: string[]
}

const API = "http://localhost:8000"
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const emptyScheduleRow = (): DaySchedule => ({ day: "Monday", start_time: "10:00 AM", end_time: "11:00 AM" })

const emptyClassForm = {
  class_name: "",
  subject_id: "",
  teacher_id: "",
  start_date: "",
  end_date: "",
  scheduleRows: [emptyScheduleRow()],
  students: [] as string[],
}

type Tab = "subjects" | "teachers" | "classes"

export default function AdminModelsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("subjects")
  const [showForm, setShowForm] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [batchFilter, setBatchFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [loading, setLoading] = useState(true)

  const [subjectForm, setSubjectForm] = useState({ subject_name: "", subject_code: "" })
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false)

  const [teacherForm, setTeacherForm] = useState({ full_name: "", subject_id: "", username: "", password: "" })
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null)
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [classForm, setClassForm] = useState(emptyClassForm)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [isSubmittingClass, setIsSubmittingClass] = useState(false)
  const [viewModal, setViewModal] = useState<{
      isOpen: boolean;
      type: "subjects" | "teachers" | "classes" | null;
      data: any;
    }>({ isOpen: false, type: null, data: null })

  const authHeader = useMemo(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const fetchAll = async () => {
    try {
      const [subjectRes, teacherRes, classRes, studentRes] = await Promise.all([
        fetch(`${API}/subjects`, { headers: authHeader }),
        fetch(`${API}/admin/teachers`, { headers: authHeader }),
        fetch(`${API}/classes`, { headers: authHeader }),
        fetch(`${API}/admin/students`, { headers: authHeader }),
      ])

      // Each resource is independent — one failure won't block the others
      if (subjectRes.ok) setSubjects(await subjectRes.json())
      else toast.error("Could not load subjects")

      if (teacherRes.ok) setTeachers(await teacherRes.json())
      else toast.error("Could not load teachers")

      if (studentRes.ok) setStudents(await studentRes.json())
      else toast.error("Could not load student list")

      if (classRes.ok) setClasses(await classRes.json())
      else toast.error("Could not load classes — check backend logs")

    } catch (error: any) {
      toast.error(error.message || "Network error — could not reach backend")
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchAll()
  }, [])

  const submitSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingSubject(true)
    try {
      const endpoint = editingSubjectId ? `${API}/admin/subjects/${editingSubjectId}` : `${API}/admin/subjects`
      const method = editingSubjectId ? "PUT" : "POST"
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(subjectForm),
      })
      if (!res.ok) throw new Error((await res.json()).detail || "Subject save failed")
      toast.success(editingSubjectId ? "Subject updated" : "Subject created")
      setSubjectForm({ subject_name: "", subject_code: "" })
      setEditingSubjectId(null)
      setShowForm(false)
      await fetchAll()
    } catch (error: any) {
      toast.error(error.message || "Subject save failed")
    } finally {
      setIsSubmittingSubject(false)
    }
  }

  const submitTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingTeacher(true)
    try {
      const endpoint = editingTeacherId ? `${API}/admin/teachers/${editingTeacherId}` : `${API}/admin/create-teacher`
      const method = editingTeacherId ? "PUT" : "POST"
      const payload = editingTeacherId
        ? {
            full_name: teacherForm.full_name,
            subject_id: teacherForm.subject_id,
            username: teacherForm.username,
            ...(teacherForm.password ? { password: teacherForm.password } : {}),
          }
        : teacherForm

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).detail || "Teacher save failed")
      toast.success(editingTeacherId ? "Teacher updated" : "Teacher created")
      setTeacherForm({ full_name: "", subject_id: "", username: "", password: "" })
      setEditingTeacherId(null)
      setShowForm(false)
      await fetchAll()
    } catch (error: any) {
      toast.error(error.message || "Teacher save failed")
    } finally {
      setIsSubmittingTeacher(false)
    }
  }

  const submitClass = async (e: React.FormEvent) => {
    e.preventDefault()

    if (classForm.start_date === classForm.end_date) {
      toast.error("Start date and end date cannot be the same")
      return
    }

    // Check for identical start/end times in schedule
    for (const row of classForm.scheduleRows) {
      if (row.start_time === row.end_time) {
        toast.error(`Session time cannot be the same for ${row.day} (${row.start_time})`)
        return
      }
    }

    setIsSubmittingClass(true)
    try {
      const endpoint = editingClassId ? `${API}/admin/classes/${editingClassId}` : `${API}/admin/classes`
      const method = editingClassId ? "PUT" : "POST"

      const payload = {
        class_name: classForm.class_name,
        subject_id: classForm.subject_id,
        teacher_id: classForm.teacher_id,
        start_date: new Date(classForm.start_date).toISOString(),
        end_date: new Date(classForm.end_date).toISOString(),
        schedule: {
          schedule: classForm.scheduleRows,
        },
        students: classForm.students,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).detail || "Class save failed")
      toast.success(editingClassId ? "Class updated" : "Class created")
      setClassForm(emptyClassForm)
      setEditingClassId(null)
      setShowForm(false)
      await fetchAll()
    } catch (error: any) {
      toast.error(error.message || "Class save failed")
    } finally {
      setIsSubmittingClass(false)
    }
  }

  const removeItem = async (type: "subjects" | "teachers" | "classes", id: string) => {
    try {
      const res = await fetch(`${API}/admin/${type}/${id}`, { method: "DELETE", headers: authHeader })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Deleted successfully")
      await fetchAll()
    } catch {
      toast.error("Delete failed")
    }
  }

  // Schedule row helpers
  const updateScheduleRow = (index: number, field: keyof DaySchedule, value: string) => {
    setClassForm((prev) => {
      const rows = prev.scheduleRows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
      return { ...prev, scheduleRows: rows }
    })
  }

  const addScheduleRow = () => {
    setClassForm((prev) => ({ ...prev, scheduleRows: [...prev.scheduleRows, emptyScheduleRow()] }))
  }

  const removeScheduleRow = (index: number) => {
    setClassForm((prev) => ({ ...prev, scheduleRows: prev.scheduleRows.filter((_, i) => i !== index) }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl animate-pulse">
        {/* Header Skeleton */}
        <div className="h-9 w-72 bg-white/10 rounded-lg mb-3"></div>
        <div className="h-4 w-96 bg-white/5 rounded-md mb-6"></div>

        {/* Tab Bar Skeleton */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-white/5 border border-white/5 w-full h-[52px]"></div>

        {/* List Content Skeleton */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex justify-end mb-2">
            <div className="h-9 w-32 bg-white/10 rounded-md"></div>
          </div>
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-48 bg-white/10 rounded-md"></div>
                <div className="h-3 w-32 bg-white/5 rounded-md"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-white/10 rounded-md"></div>
                <div className="h-8 w-8 bg-white/10 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: "subjects", label: "Subjects", icon: <BookOpen size={15} /> },
    { value: "teachers", label: "Teachers", icon: <GraduationCap size={15} /> },
    { value: "classes", label: "Classes", icon: <Layers3 size={15} /> },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-white mb-2">Manage Academic Models</h1>
      <p className="text-sm text-slate-400 mb-6">Create, update, and delete Subjects, Teachers, and Classes from one page.</p>

      {/* ── Custom Tab Bar ── */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-white/5 border border-white/5 w-full">
        {tabs.map((t) => {
          const isActive = activeTab === t.value
          return (
            <button
              key={t.value}
              onClick={() => { setActiveTab(t.value); setShowForm(false); }}
              className={`
                flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                ${isActive
                  ? "bg-[#0f1e40] text-blue-300 shadow-lg shadow-blue-950/60 border border-blue-900/50"
                  : "text-slate-400 hover:text-white hover:bg-white/10"}
              `}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ══════════════ SUBJECTS TAB ══════════════ */}
      {activeTab === "subjects" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {showForm ? (
            {/* ... existing form code ... */}
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Subject</Button>
              </div>
              {subjects.length === 0 ? (
                {/* ... existing empty state ... */}
              ) : (
                subjects.map((s) => (
                  <Card key={s.id} className="bg-card/30 border-white/5 transition-all hover:border-white/10 hover:bg-card/40 group">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold group-hover:text-blue-400 transition-colors">{s.subject_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{s.subject_code}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/5 hover:bg-white/10"
                          onClick={() => setViewModal({ isOpen: true, type: "subjects", data: s })}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="border-white/5 hover:bg-white/10" onClick={() => { setEditingSubjectId(s.id); setSubjectForm({ subject_name: s.subject_name, subject_code: s.subject_code }); setShowForm(true); }}><Pencil size={14} /></Button>
                        <Button variant="destructive" size="sm" className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white" onClick={() => removeItem("subjects", s.id)}><Trash2 size={14} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════ TEACHERS TAB ══════════════ */}
      {activeTab === "teachers" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {showForm ? (
            {/* ... existing form code ... */}
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Teacher</Button>
              </div>
              {teachers.length === 0 ? (
                {/* ... existing empty state ... */}
              ) : (
                teachers.map((t) => {
                  const teacherSubject = subjects.find(s => s.id === t.subject_id)
                  return (
                    <Card key={t.id} className="bg-card/30 border-white/5 transition-all hover:border-white/10 hover:bg-card/40 group">
                      <CardContent className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold group-hover:text-indigo-400 transition-colors">{t.full_name}</p>
                          <p className="text-xs text-slate-400">{t.username}</p>
                          {teacherSubject && <p className="text-xs text-slate-500 mt-0.5">Subject: {teacherSubject.subject_name}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-white/5 hover:bg-white/10"
                            onClick={() => setViewModal({ isOpen: true, type: "teachers", data: { ...t, subject_name: teacherSubject?.subject_name } })}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button variant="outline" size="sm" className="border-white/5 hover:bg-white/10" onClick={() => { setEditingTeacherId(t.id); setTeacherForm({ full_name: t.full_name, subject_id: t.subject_id, username: t.username, password: "" }); setShowForm(true); setShowPassword(false); }}><Pencil size={14} /></Button>
                          <Button variant="destructive" size="sm" className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white" onClick={() => removeItem("teachers", t.id)}><Trash2 size={14} /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════ CLASSES TAB ══════════════ */}
      {activeTab === "classes" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {showForm ? (
            {/* ... existing form code ... */}
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Class</Button>
              </div>
              {classes.length === 0 ? (
                {/* ... existing empty state ... */}
              ) : (
                classes.map((c) => {
                  const classSubject = subjects.find(s => s.id === c.subject_id)
                  const classTeacher = teachers.find(t => t.id === c.teacher_id)
                  return (
                    <Card key={c.id} className="bg-card/30 border-white/5 transition-all hover:border-white/10 hover:bg-card/40 group">
                      <CardContent className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold group-hover:text-emerald-400 transition-colors">{c.class_name}</p>
                          <p className="text-xs text-slate-400">{c.teacher_name || classTeacher?.full_name} • Students: {c.student_count}</p>
                          {(classSubject || c.subject_name) && (
                            <p className="text-xs text-slate-500 mt-0.5">Subject: {c.subject_name || classSubject?.subject_name}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-white/5 hover:bg-white/10"
                            onClick={() => setViewModal({ 
                              isOpen: true, 
                              type: "classes", 
                              data: { 
                                ...c, 
                                subject_name: c.subject_name || classSubject?.subject_name,
                                teacher_name: c.teacher_name || classTeacher?.full_name,
                                schedule_rows: c.schedule?.schedule || []
                              } 
                            })}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/5 hover:bg-white/10"
                            onClick={() => {
                              const rows = c.schedule?.schedule?.length
                                ? c.schedule.schedule
                                : [emptyScheduleRow()]
                              setEditingClassId(c.id)
                              setClassForm({
                                class_name: c.class_name,
                                subject_id: c.subject_id,
                                teacher_id: c.teacher_id,
                                start_date: c.start_date.slice(0, 10),
                                end_date: c.end_date.slice(0, 10),
                                scheduleRows: rows,
                                students: c.students,
                              })
                              setShowForm(true)
                            }}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button variant="destructive" size="sm" className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white" onClick={() => removeItem("classes", c.id)}><Trash2 size={14} /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </>
          )}
        </div>
      )}

      <Dialog open={viewModal.isOpen} onOpenChange={(open) => setViewModal({ isOpen: open, type: null, data: null })}>
        <DialogContent className="bg-[#0d1b2e] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold capitalize">
              {viewModal.type === "subjects" && "Subject Details"}
              {viewModal.type === "teachers" && "Teacher Details"}
              {viewModal.type === "classes" && "Class Details"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Detailed information about the selected {viewModal.type?.slice(0, -1)}
            </DialogDescription>
          </DialogHeader>

          {viewModal.type === "subjects" && viewModal.data && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Subject Name</label>
                    <p className="text-white font-medium mt-1">{viewModal.data.subject_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Subject Code</label>
                    <p className="text-white font-mono mt-1">{viewModal.data.subject_code}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">ID</label>
                <p className="text-white font-mono text-sm mt-1">{viewModal.data.id}</p>
              </div>
            </div>
          )}

          {viewModal.type === "teachers" && viewModal.data && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Full Name</label>
                    <p className="text-white font-medium mt-1">{viewModal.data.full_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Username</label>
                    <p className="text-white font-mono mt-1">{viewModal.data.username}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Assigned Subject</label>
                <p className="text-white mt-1">{viewModal.data.subject_name || subjects.find(s => s.id === viewModal.data.subject_id)?.subject_name || "Not Assigned"}</p>
                {viewModal.data.subject_id && (
                  <p className="text-xs text-slate-500 mt-1 font-mono">Subject ID: {viewModal.data.subject_id}</p>
                )}
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Teacher ID</label>
                <p className="text-white font-mono text-sm mt-1">{viewModal.data.id}</p>
              </div>
            </div>
          )}

          {viewModal.type === "classes" && viewModal.data && (
            <div className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Class Name</label>
                    <p className="text-white font-medium mt-1">{viewModal.data.class_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Teacher</label>
                    <p className="text-white mt-1">{viewModal.data.teacher_name}</p>
                  </div>
                </div>
              </div>

              {/* Subject Info */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">Subject Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Subject Name</label>
                    <p className="text-white mt-1">{viewModal.data.subject_name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Subject ID</label>
                    <p className="text-white font-mono text-sm mt-1">{viewModal.data.subject_id}</p>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">Date Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">Start Date</label>
                    <p className="text-white mt-1">{new Date(viewModal.data.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider">End Date</label>
                    <p className="text-white mt-1">{new Date(viewModal.data.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              {viewModal.data.schedule_rows && viewModal.data.schedule_rows.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-blue-400 mb-3">Weekly Schedule</h3>
                  <div className="space-y-2">
                    {viewModal.data.schedule_rows.map((row: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-white font-medium">{row.day}</span>
                        <span className="text-slate-300">{row.start_time} - {row.end_time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">
                  Enrolled Students ({viewModal.data.student_count || viewModal.data.students?.length || 0})
                </h3>
                {viewModal.data.students && viewModal.data.students.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {viewModal.data.students.map((studentId: string, idx: number) => {
                      const student = students.find(s => s.studentID === studentId)
                      return (
                        <div key={idx} className="flex items-center justify-between py-1 text-sm">
                          <span className="text-white">{student?.fullName || "Unknown Student"}</span>
                          <span className="text-slate-400 font-mono text-xs">{studentId}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No students enrolled in this class.</p>
                )}
              </div>

              {/* Class ID */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Class ID</label>
                <p className="text-white font-mono text-sm mt-1">{viewModal.data.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
