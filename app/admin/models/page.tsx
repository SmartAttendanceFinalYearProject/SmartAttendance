"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, GraduationCap, Layers3, Trash2, Pencil, Plus, X, Eye, EyeOff, User, Hash, Calendar, Clock, Users, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

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

// ── Helper Components for Details ──
function DetailItem({ label, value, icon, isCode = false }: { label: string; value: string; icon: React.ReactNode; isCode?: boolean }) {
  return (
    <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors group">
      <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-400 transition-colors">
        {icon}
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className={`text-white font-medium ${isCode ? "font-mono text-xs bg-black/30 p-2 rounded-lg border border-white/5 mt-1" : "text-base"}`}>
        {value}
      </p>
    </div>
  )
}

function InfoBadge({ icon, text, className = "" }: { icon: React.ReactNode; text: string; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white backdrop-blur-md ${className}`}>
      <span className="text-blue-400">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function DetailSection({ title, icon, children, badge }: { title: string; icon: React.ReactNode; children: React.ReactNode; badge?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 text-blue-400">
          {icon}
          <h4 className="text-sm font-bold uppercase tracking-wider">{title}</h4>
        </div>
        {badge && <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{badge}</Badge>}
      </div>
      <div className="animate-fade-in-up">
        {children}
      </div>
    </div>
  )
}

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
        <DialogContent className="bg-[#0b1222]/95 backdrop-blur-xl border-white/10 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 shadow-2xl shadow-blue-500/10 gap-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
                {viewModal.type === "subjects" && <BookOpen size={24} />}
                {viewModal.type === "teachers" && <GraduationCap size={24} />}
                {viewModal.type === "classes" && <Layers3 size={24} />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                  {viewModal.type === "subjects" && "Subject Details"}
                  {viewModal.type === "teachers" && "Teacher Details"}
                  {viewModal.type === "classes" && "Class Details"}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-1">
                  Comprehensive overview for this {viewModal.type?.slice(0, -1)} resource.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 pt-2 scrollbar-thin">
            {viewModal.type === "subjects" && viewModal.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem label="Subject Name" value={viewModal.data.subject_name} icon={<BookOpen size={14} />} />
                  <DetailItem label="Subject Code" value={viewModal.data.subject_code} icon={<Hash size={14} />} isCode />
                </div>
                <DetailItem label="Internal Resource ID" value={viewModal.data.id} icon={<Layers3 size={14} />} isCode />
              </div>
            )}

            {viewModal.type === "teachers" && viewModal.data && (
              <div className="space-y-8">
                <div className="flex items-center gap-5 p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-600/5 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <GraduationCap size={80} />
                  </div>
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-950/40 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    {viewModal.data.full_name.charAt(0)}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white tracking-tight">{viewModal.data.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-blue-400 text-sm font-medium">Verified Academic Faculty</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem label="Portal Username" value={viewModal.data.username} icon={<User size={14} />} isCode />
                  <DetailItem 
                    label="Primary Subject" 
                    value={viewModal.data.subject_name || subjects.find(s => s.id === viewModal.data.subject_id)?.subject_name || "Not Assigned"} 
                    icon={<BookOpen size={14} />} 
                  />
                </div>
                <DetailItem label="Teacher Reference ID" value={viewModal.data.id} icon={<Hash size={14} />} isCode />
              </div>
            )}

            {viewModal.type === "classes" && viewModal.data && (
              <div className="space-y-8">
                {/* Hero Header */}
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-transparent border border-blue-500/20 overflow-hidden shadow-lg shadow-blue-950/20">
                  <div className="absolute -right-12 -top-12 text-white/5 rotate-12 scale-150">
                    <Layers3 size={160} />
                  </div>
                  <div className="relative z-10">
                    <Badge className="mb-4 bg-blue-500 text-white border-0 px-3 py-1 text-[10px] uppercase tracking-widest font-black">Active Class</Badge>
                    <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">{viewModal.data.class_name}</h3>
                    <div className="flex flex-wrap gap-3">
                      <InfoBadge icon={<User size={14} />} text={viewModal.data.teacher_name} />
                      <InfoBadge icon={<BookOpen size={14} />} text={viewModal.data.subject_name} />
                      <InfoBadge icon={<Users size={14} />} text={`${viewModal.data.student_count || viewModal.data.students?.length || 0} Students`} />
                    </div>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DetailSection title="Class Timeline" icon={<Calendar size={18} />}>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Commencement</span>
                        <span className="text-sm font-semibold text-white">{new Date(viewModal.data.start_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-rose-500/30 transition-colors">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Conclusion</span>
                        <span className="text-sm font-semibold text-white">{new Date(viewModal.data.end_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      </div>
                    </div>
                  </DetailSection>

                  <DetailSection title="Session Schedule" icon={<Clock size={18} />}>
                    <div className="space-y-2">
                      {viewModal.data.schedule_rows && viewModal.data.schedule_rows.length > 0 ? (
                        viewModal.data.schedule_rows.map((row: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group">
                            <span className="text-sm font-bold text-blue-300 group-hover:text-blue-100">{row.day}</span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[10px] font-mono text-blue-300 border border-blue-500/20">
                                {row.start_time} - {row.end_time}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 rounded-xl border border-dashed border-white/5 bg-white/5">
                          <p className="text-slate-500 text-xs italic">No specific sessions defined</p>
                        </div>
                      )}
                    </div>
                  </DetailSection>
                </div>

                {/* Enrolled Students Section */}
                <DetailSection title="Enrolled Students" icon={<Users size={18} />} badge={`${viewModal.data.students?.length || 0}`}>
                  {viewModal.data.students && viewModal.data.students.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                      {viewModal.data.students.map((studentId: string, idx: number) => {
                        const student = students.find(s => s.studentID === studentId)
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/20 transition-all group">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-inner">
                              <User size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[140px]">
                                {student?.fullName || "Student Name"}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-tighter">ID: {studentId}</span>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-3xl border border-dashed border-white/10 bg-white/5">
                      <Users size={32} className="mx-auto text-slate-600 mb-2 opacity-20" />
                      <p className="text-slate-500 text-sm">No students currently enrolled in this record.</p>
                    </div>
                  )}
                </DetailSection>

                {/* System ID Footer */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">System Reference Code</span>
                  <span className="text-[10px] font-mono text-slate-400 select-all">{viewModal.data.id}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-md flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setViewModal({ isOpen: false, type: null, data: null })}
              className="border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-8 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
            >
              Dismiss Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
