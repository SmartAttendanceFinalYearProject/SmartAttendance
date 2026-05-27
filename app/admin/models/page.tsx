"use client"

import { BookOpen, GraduationCap, Layers3, Trash2, Pencil, Plus, X, Eye, EyeOff, Users } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Tab = "subjects" | "teachers" | "classes" | "students"
type Subject = { id: string; subject_name: string; subject_code: string }
type Teacher = { id: string; full_name: string; subject_id: string; username: string }
type Student = { id: string; fullName: string; studentID:  string; batch?: string; class_year?: string; semester?: string; section?: string; email?: string; department?: string }
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
type StudentPerformance = {
  student_id: string
  full_name: string
  studentID: string
  department?: string
  batch?: string
  class_year?: string
  semester?: string
  overall_attendance: number
  total_sessions: number
  classes: Array<{
    class_id: string
    class_name: string
    subject_name: string
    attendance_rate: number
    total_sessions: number
    present_count: number
  }>
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



type ViewItem =
  | { type: "subjects"; data: Subject }
  | { type: "teachers"; data: Teacher }
  | { type: "classes"; data: ClassItem }
  | { type: "students"; data: Student }   
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong"
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

const [studentForm, setStudentForm] = useState({
  fullName: "",
  department: "",
  section: "",
  email: "",
  batch: "",
  class_year: "",
  semester: "",
});

const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
const [showStudentForm, setShowStudentForm] = useState(false);
const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  const [classForm, setClassForm] = useState(emptyClassForm)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [isSubmittingClass, setIsSubmittingClass] = useState(false)
  const [viewingItem, setViewingItem] = useState<ViewItem | null>(null)

  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  const authHeader = useMemo((): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [subjectRes, teacherRes, classRes, studentRes,studentPerfRes] = await Promise.all([
        fetch(`${API}/subjects`, { headers: authHeader }),
        fetch(`${API}/admin/teachers`, { headers: authHeader }),
        fetch(`${API}/classes`, { headers: authHeader }),
        fetch(`${API}/admin/students`, { headers: authHeader }),
        fetch(`${API}/admin/students/performance`, { headers: authHeader }),
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
      
      if (studentPerfRes.ok) {
      setStudentPerformance(await studentPerfRes.json())
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error) || "Network error — could not reach backend")
    } finally {
      setLoading(false)
    }
  }, [authHeader])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])
  const submitStudent = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmittingStudent(true)
  try {
    const endpoint = `${API}/admin/students/${editingStudentId}`
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(studentForm),
    })

    if (!res.ok) throw new Error((await res.json()).detail || "Failed to update")

    toast.success(editingStudentId ? "Student updated successfully" : "Student registered")
    setShowStudentForm(false)
    setEditingStudentId(null)
    await fetchAll()
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    setIsSubmittingStudent(false)
  }
}

const removeStudent = async (studentID: string) => {
  if (!confirm("Are you sure you want to delete this student?")) return
  try {
    const res = await fetch(`${API}/admin/students/${studentID}`, {
      method: "DELETE",
      headers: authHeader
    })
    if (!res.ok) throw new Error("Delete failed")
    toast.success("Student deleted successfully")
    await fetchAll()
  } catch {
    toast.error("Failed to delete student")
  }
}

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
    } catch (error: unknown) {
      toast.error(errorMessage(error) || "Subject save failed")
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
    } catch (error: unknown) {
      toast.error(errorMessage(error) || "Teacher save failed")
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
    } catch (error: unknown) {
      toast.error(errorMessage(error) || "Class save failed")
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
  { value: "students", label: "Students", icon: <Users size={15} /> }, // Import Users from lucide-react
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
            <Card className="bg-card/40 border-0 relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Subject Form</CardTitle>
                <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => { setShowForm(false); setEditingSubjectId(null); setSubjectForm({ subject_name: "", subject_code: "" }); }}>
                  <X size={16} />
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <form className="flex flex-col gap-3 max-w-sm mx-auto" onSubmit={submitSubject}>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Subject Name</Label>
                    <Input
                      placeholder="e.g. Mathematics"
                      value={subjectForm.subject_name}
                      onChange={(e) => setSubjectForm((p) => ({ ...p, subject_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Subject Code</Label>
                    <Input
                      placeholder="e.g. MATH101"
                      value={subjectForm.subject_code}
                      onChange={(e) => setSubjectForm((p) => ({ ...p, subject_code: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="mt-1" disabled={isSubmittingSubject}>
                  {isSubmittingSubject ? (
                    <><div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : editingSubjectId ? "Update Subject" : "Create Subject"}
                </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Subject</Button>
              </div>
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-blue-500/5 flex items-center justify-center mb-4">
                    <BookOpen size={32} className="text-slate-600" />
                  </div>
                  <p className="text-white font-bold mb-1">No Subjects Registered</p>
                  <p className="text-xs text-slate-500 mb-6 text-center max-w-[280px]">
                    Your academic system needs subjects to function. Create your first subject to begin assigning teachers and classes.
                  </p>
                  <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl px-6">
                    <Plus size={16} /> Create First Subject
                  </Button>
                </div>
              ) : (
                subjects.map((s) => (
                  <Card key={s.id} className="bg-card/30 border-white/5 transition-all hover:border-white/10 hover:bg-card/40 group">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold group-hover:text-blue-400 transition-colors">{s.subject_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{s.subject_code}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-white/5 hover:bg-white/10" onClick={() => setViewingItem({ type: "subjects", data: s })}><Eye size={14} /></Button>
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
            <Card className="bg-card/40 border-0 relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Teacher Form</CardTitle>
                <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => { setShowForm(false); setEditingTeacherId(null); setTeacherForm({ full_name: "", subject_id: "", username: "", password: "" }); setShowPassword(false); }}>
                  <X size={16} />
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <form className="flex flex-col gap-3 max-w-sm mx-auto" onSubmit={submitTeacher}>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Full Name</Label>
                    <Input
                      placeholder="e.g. Dr. Abebe Girma"
                      value={teacherForm.full_name}
                      onChange={(e) => setTeacherForm((p) => ({ ...p, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Username</Label>
                    <Input
                      placeholder="e.g. teacher01"
                      value={teacherForm.username}
                      onChange={(e) => setTeacherForm((p) => ({ ...p, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Subject</Label>
                    <Select value={teacherForm.subject_id} onValueChange={(v) => setTeacherForm((p) => ({ ...p, subject_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">{editingTeacherId ? "New Password (optional)" : "Password"}</Label>
                    <div className="relative">
                      <Input
                        placeholder={editingTeacherId ? "Leave blank to keep current" : "Password"}
                        type={showPassword ? "text" : "password"}
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm((p) => ({ ...p, password: e.target.value }))}
                        required={!editingTeacherId}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="mt-1" disabled={isSubmittingTeacher}>
                    {isSubmittingTeacher ? (
                      <><div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    ) : editingTeacherId ? "Update Teacher" : "Create Teacher"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Teacher</Button>
              </div>
              {teachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/5 flex items-center justify-center mb-4">
                    <GraduationCap size={32} className="text-slate-600" />
                  </div>
                  <p className="text-white font-bold mb-1">No Teachers Found</p>
                  <p className="text-xs text-slate-500 mb-6 text-center max-w-[280px]">
                    You haven&apos;t added any teachers yet. Registered teachers will be able to manage their own classes and attendance.
                  </p>
                  <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl px-6">
                    <Plus size={16} /> Create First Teacher
                  </Button>
                </div>
              ) : (
                teachers.map((t) => (
                  <Card key={t.id} className="bg-card/30 border-white/5 transition-all hover:border-white/10 hover:bg-card/40 group">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold group-hover:text-indigo-400 transition-colors">{t.full_name}</p>
                        <p className="text-xs text-slate-400">{t.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-white/5 hover:bg-white/10" onClick={() => setViewingItem({ type: "teachers", data: t })}><Eye size={14} /></Button>
                        <Button variant="outline" size="sm" className="border-white/5 hover:bg-white/10" onClick={() => { setEditingTeacherId(t.id); setTeacherForm({ full_name: t.full_name, subject_id: t.subject_id, username: t.username, password: "" }); setShowForm(true); setShowPassword(false); }}><Pencil size={14} /></Button>
                        <Button variant="destructive" size="sm" className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white" onClick={() => removeItem("teachers", t.id)}><Trash2 size={14} /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════ CLASSES TAB ══════════════ */}
      {activeTab === "classes" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {showForm ? (
            <Card className="bg-card/40 border-0 relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Class Form</CardTitle>
                <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => { setShowForm(false); setEditingClassId(null); setClassForm(emptyClassForm); }}>
                  <X size={16} />
                </Button>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <form className="flex flex-col gap-4 max-w-lg mx-auto" onSubmit={submitClass}>

                  {/* Class Name */}
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Class Name</Label>
                  <Input
                    placeholder="e.g. Year 2 Section A"
                    value={classForm.class_name}
                    onChange={(e) => setClassForm((p) => ({ ...p, class_name: e.target.value }))}
                    required
                  />
                </div>

                {/* Select Subject */}
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Subject</Label>
                  <Select value={classForm.subject_id} onValueChange={(v) => setClassForm((p) => ({ ...p, subject_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Select Teacher */}
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Teacher</Label>
                  <Select value={classForm.teacher_id} onValueChange={(v) => setClassForm((p) => ({ ...p, teacher_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                    <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Start & End Date — horizontal, calendar picker */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Start Date</Label>
                    <Input
                      type="date"
                      value={classForm.start_date}
                      onChange={(e) => setClassForm((p) => ({ ...p, start_date: e.target.value }))}
                      required
                      className="cursor-pointer [color-scheme:dark] bg-[#0d1b2e]/70 border-blue-900/40 text-blue-100 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">End Date</Label>
                    <Input
                      type="date"
                      value={classForm.end_date}
                      onChange={(e) => setClassForm((p) => ({ ...p, end_date: e.target.value }))}
                      required
                      className="cursor-pointer [color-scheme:dark] bg-[#0d1b2e]/70 border-blue-900/40 text-blue-100 backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Schedule Rows */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Weekly Schedule</Label>

                  {classForm.scheduleRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-wrap">
                      {/* Day selector */}
                      <Select value={row.day} onValueChange={(v) => updateScheduleRow(idx, "day", v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      {/* Start time */}
                      <div className="flex-1 space-y-0.5 min-w-[110px]">
                        <Input
                          type="time"
                          value={row.start_time}
                          onChange={(e) => updateScheduleRow(idx, "start_time", e.target.value)}
                          required
                          className="cursor-pointer"
                        />
                      </div>

                      <span className="text-slate-500 text-sm">–</span>

                      {/* End time */}
                      <div className="flex-1 space-y-0.5 min-w-[110px]">
                        <Input
                          type="time"
                          value={row.end_time}
                          onChange={(e) => updateScheduleRow(idx, "end_time", e.target.value)}
                          required
                          className="cursor-pointer"
                        />
                      </div>

                      {/* Remove row button (only if more than 1) */}
                      {classForm.scheduleRows.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => removeScheduleRow(idx)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* + Add another day button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 gap-1.5 border-dashed border-white/20 text-slate-400 hover:text-white"
                    onClick={addScheduleRow}
                  >
                    <Plus size={14} />
                    Add Another Day
                  </Button>
                </div>

                {/* Students multi-select */}
                {/* Students multi-select */}
                {(() => {
                  const filteredStudents = students.filter((s) => {
                    const matchesSearch = !studentSearch || s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || s.studentID.toLowerCase().includes(studentSearch.toLowerCase())
                    const matchesBatch = !batchFilter || (s.batch && s.batch.toLowerCase().includes(batchFilter.toLowerCase()))
                    const matchesYear = !yearFilter || (s.class_year && s.class_year.toLowerCase().includes(yearFilter.toLowerCase()))
                    const matchesSem = !semesterFilter || (s.semester && s.semester.toLowerCase().includes(semesterFilter.toLowerCase()))
                    const matchesSec = !sectionFilter || (s.section && s.section.toLowerCase().includes(sectionFilter.toLowerCase()))
                    const matchesDept = !departmentFilter || (s.department && s.department.toLowerCase().includes(departmentFilter.toLowerCase()))
                    
                    return matchesSearch && matchesBatch && matchesYear && matchesSem && matchesSec && matchesDept
                  })
                  
                  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => classForm.students.includes(s.studentID))

                  return (
                    <div className="space-y-3 mt-4 bg-slate-900/40 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          Select Students
                          {classForm.students.length > 0 && (
                            <span className="ml-2 text-blue-400 normal-case font-normal bg-blue-500/10 px-2 py-0.5 rounded-full">
                              {classForm.students.length} selected
                            </span>
                          )}
                        </Label>
                        {filteredStudents.length > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            onClick={() => {
                              if (allFilteredSelected) {
                                const filteredIds = filteredStudents.map(s => s.studentID)
                                setClassForm(p => ({ ...p, students: p.students.filter(id => !filteredIds.includes(id)) }))
                              } else {
                                const filteredIds = filteredStudents.map(s => s.studentID)
                                setClassForm(p => ({ ...p, students: Array.from(new Set([...p.students, ...filteredIds])) }))
                              }
                            }}
                          >
                            {allFilteredSelected ? "Deselect All Filtered" : "Select All Filtered"}
                          </Button>
                        )}
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <Input placeholder="Batch (e.g. 2022)" value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="bg-slate-900/80 border-white/10 text-white text-xs h-8" />
                        <Input placeholder="Year (e.g. 3rd)" value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="bg-slate-900/80 border-white/10 text-white text-xs h-8" />
                        <Input placeholder="Sem (e.g. 1st)" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className="bg-slate-900/80 border-white/10 text-white text-xs h-8" />
                        <Input placeholder="Sec (e.g. A)" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="bg-slate-900/80 border-white/10 text-white text-xs h-8" />
                        <Input placeholder="Dept" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="bg-slate-900/80 border-white/10 text-white text-xs h-8" />
                      </div>

                      {/* Search */}
                      <Input
                        placeholder="Search students by name or ID…"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500 h-9"
                      />

                      {students.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">
                          No registered students found.
                        </p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/60 divide-y divide-white/5">
                          {filteredStudents.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-3 px-3 text-center">No students match the filters.</p>
                          ) : (
                            filteredStudents.map((s) => {
                              const checked = classForm.students.includes(s.studentID)
                              return (
                                <label
                                  key={s.id}
                                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                                    checked ? "bg-blue-900/30" : "hover:bg-white/5"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setClassForm((p) => ({
                                        ...p,
                                        students: checked
                                          ? p.students.filter((id) => id !== s.studentID)
                                          : [...p.students, s.studentID],
                                      }))
                                    }}
                                    className="accent-blue-500 h-4 w-4 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{s.fullName}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                      <span className="text-xs text-slate-400 font-mono">{s.studentID}</span>
                                      {s.department && <span className="text-[10px] bg-white/5 text-slate-300 px-1.5 py-0.5 rounded">{s.department}</span>}
                                      {s.batch && <span className="text-[10px] bg-white/5 text-slate-300 px-1.5 py-0.5 rounded">B{s.batch}</span>}
                                      {s.class_year && <span className="text-[10px] bg-white/5 text-slate-300 px-1.5 py-0.5 rounded">Yr {s.class_year}</span>}
                                      {s.semester && <span className="text-[10px] bg-white/5 text-slate-300 px-1.5 py-0.5 rounded">Sem {s.semester}</span>}
                                      {s.section && <span className="text-[10px] bg-white/5 text-slate-300 px-1.5 py-0.5 rounded">Sec {s.section}</span>}
                                    </div>
                                  </div>
                                </label>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

                <Button type="submit" className="mt-1" disabled={isSubmittingClass}>
                  {isSubmittingClass ? (
                    <><div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : editingClassId ? "Update Class" : "Create Class"}
                </Button>
              </form>
            </CardContent>
          </Card>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Class</Button>
              </div>
              {classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/5 flex items-center justify-center mb-4">
                    <Layers3 size={32} className="text-slate-600" />
                  </div>
                  <p className="text-white font-bold mb-1">No Classes Scheduled</p>
                  <p className="text-xs text-slate-500 mb-6 text-center max-w-[280px]">
                    Create classes to link subjects, teachers, and students together for real-time attendance tracking.
                  </p>
                  <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl px-6">
                    <Plus size={16} /> Create First Class
                  </Button>
                </div>
              ) : (
                classes.map((c) => (
                  <Card key={c.id} className="bg-card/30 border-white/5 transition-all hover:border-white/10 hover:bg-card/40 group">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold group-hover:text-emerald-400 transition-colors">{c.class_name}</p>
                        <p className="text-xs text-slate-400">{c.teacher_name} • Students: {c.student_count}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-white/5 hover:bg-white/10" onClick={() => setViewingItem({ type: "classes", data: c })}><Eye size={14} /></Button>
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
                ))
              )}
            </>
          )}
        </div>
      )}
{/* ══════════════ STUDENTS TAB ══════════════ */}
{activeTab === "students" && (
  <div className="space-y-4 max-w-2xl mx-auto">
    <div className="flex justify-end mb-2">
      <Button onClick={() => setShowStudentForm(true)} className="gap-2">
        <Plus size={16} /> Register New Student
      </Button>
    </div>

    {students.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
        <div className="w-16 h-16 rounded-full bg-blue-500/5 flex items-center justify-center mb-4">
          <Users size={32} className="text-slate-600" />
        </div>
        <p className="text-white font-bold mb-1">No Students Registered</p>
        <Button onClick={() => setShowStudentForm(true)} variant="outline" className="gap-2">
          <Plus size={16} /> Register First Student
        </Button>
      </div>
    ) : (
      students
        .filter(s => 
          !studentSearch || 
          s.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.studentID?.toLowerCase().includes(studentSearch.toLowerCase())
        )
        .map((student) => (
          <Card key={student.id} className="bg-card/30 border-white/5 hover:bg-card/40 group">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold group-hover:text-blue-400">{student.fullName}</p>
                <p className="text-xs text-slate-400 font-mono">{student.studentID}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {student.department && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">{student.department}</span>}
                  {student.batch && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">B{student.batch}</span>}
                  {student.class_year && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">Yr {student.class_year}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-white/5 hover:bg-white/10" onClick={() => setViewingItem({ type: "students", data: student })}>
                  <Eye size={14} />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/5 hover:bg-white/10"
                  onClick={() => {
                    setEditingStudentId(student.studentID)
                    setStudentForm({
                      fullName: student.fullName || "",
                      department: student.department || "",
                      section: student.section || "",
                      email: student.email || "",
                      batch: student.batch || "",
                      class_year: student.class_year || "",
                      semester: student.semester || "",
                    })
                    setShowStudentForm(true)
                  }}
                >
                  <Pencil size={14} />
                </Button>
                <Button variant="destructive" size="sm" className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white" onClick={() => removeStudent(student.studentID)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
    )}
  </div>
)}
      {/* ── View Detail Modal ── */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent className="bg-[#0b1426] border-white/10 text-white max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {viewingItem?.type === "subjects" && <BookOpen className="text-blue-400" />}
              {viewingItem?.type === "teachers" && <GraduationCap className="text-indigo-400" />}
              {viewingItem?.type === "classes" && <Layers3 className="text-emerald-400" />}
              {viewingItem?.type === "subjects" ? "Subject Details" : viewingItem?.type === "teachers" ? "Teacher Details" : "Class Details"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-6 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
            {viewingItem?.type === "subjects" && (
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-400 text-sm">Subject Name</span>
                  <span className="col-span-2 font-medium">{viewingItem.data.subject_name}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-400 text-sm">Subject Code</span>
                  <span className="col-span-2 font-mono text-blue-400">{viewingItem.data.subject_code}</span>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3">Assigned Teachers</h4>
                  {teachers.filter(t => t.subject_id === viewingItem.data.id).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {teachers.filter(t => t.subject_id === viewingItem.data.id).map(t => (
                        <span key={t.id} className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs border border-indigo-500/20">
                          {t.full_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No teachers assigned yet</p>
                  )}
                </div>
              </div>
            )}{viewingItem?.type === "students" && (
  <div className="grid gap-4">
    <div className="grid grid-cols-3 gap-1">
      <span className="text-slate-400 text-sm">Full Name</span>
      <span className="col-span-2 font-medium">{viewingItem.data.fullName}</span>
    </div>
    <div className="grid grid-cols-3 gap-1">
      <span className="text-slate-400 text-sm">Student ID</span>
      <span className="col-span-2 font-mono text-blue-400">{viewingItem.data.studentID}</span>
    </div>
    {viewingItem.data.email && (
      <div className="grid grid-cols-3 gap-1">
        <span className="text-slate-400 text-sm">Email</span>
        <span className="col-span-2">{viewingItem.data.email}</span>
      </div>
    )}
    <div className="grid grid-cols-3 gap-1">
      <span className="text-slate-400 text-sm">Department</span>
      <span className="col-span-2">{viewingItem.data.department || "N/A"}</span>
    </div>
    <div className="grid grid-cols-3 gap-1">
      <span className="text-slate-400 text-sm">Section</span>
      <span className="col-span-2">{viewingItem.data.section || "N/A"}</span>
    </div>
    <div className="grid grid-cols-3 gap-1">
      <span className="text-slate-400 text-sm">Batch / Year / Semester</span>
      <span className="col-span-2">
        {viewingItem.data.batch ? `Batch ${viewingItem.data.batch}` : ""} 
        {viewingItem.data.class_year ? ` • Year ${viewingItem.data.class_year}` : ""} 
        {viewingItem.data.semester ? ` • Sem ${viewingItem.data.semester}` : ""}
      </span>
    </div>
  </div>
)}

            {viewingItem?.type === "teachers" && (
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-400 text-sm">Full Name</span>
                  <span className="col-span-2 font-medium">{viewingItem.data.full_name}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-400 text-sm">Username</span>
                  <span className="col-span-2 font-mono text-indigo-400">{viewingItem.data.username}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-slate-400 text-sm">Specialization</span>
                  <span className="col-span-2 font-medium">
                    {subjects.find(s => s.id === viewingItem.data.subject_id)?.subject_name || "N/A"}
                  </span>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3">Assigned Classes</h4>
                  {classes.filter(c => c.teacher_id === viewingItem.data.id).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {classes.filter(c => c.teacher_id === viewingItem.data.id).map(c => (
                        <div key={c.id} className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
                          <p className="text-sm font-medium text-emerald-400">{c.class_name}</p>
                          <p className="text-[10px] text-slate-400">{c.student_count} Students</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No classes assigned yet</p>
                  )}
                </div>
              </div>
            )}

            {viewingItem?.type === "classes" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Class Name</span>
                    <span className="font-medium text-lg text-emerald-400">{viewingItem.data.class_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Subject</span>
                    <span className="font-medium">{subjects.find(s => s.id === viewingItem.data.subject_id)?.subject_name || "N/A"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Teacher</span>
                    <span className="font-medium">{viewingItem.data.teacher_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Duration</span>
                    <span className="font-medium text-xs">
                      {new Date(viewingItem.data.start_date).toLocaleDateString()} - {new Date(viewingItem.data.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3 flex items-center justify-between">
                    Weekly Schedule
                    <span className="text-[10px] lowercase font-normal bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Recurrent</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingItem.data.schedule?.schedule?.map((s: DaySchedule, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-sm font-medium">{s.day}</span>
                        <span className="text-xs font-mono text-slate-400">{s.start_time} - {s.end_time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3">
                    Students ({viewingItem.data.students?.length || 0})
                  </h4>
                  <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2 custom-scrollbar">
                    {viewingItem.data.students?.map((studentId: string) => {
                      const student = students.find(s => s.studentID === studentId)
                      return (
                        <div key={studentId} className="bg-white/5 p-2 rounded-lg flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-500/20">
                            {student?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "S"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{student?.fullName || "Unknown Student"}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{studentId}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Student Edit Form Modal */}
<Dialog open={showStudentForm} onOpenChange={() => { setShowStudentForm(false); setEditingStudentId(null); }}>
  <DialogContent className="bg-[#0b1426] border-white/10 text-white max-w-md">
    <DialogHeader>
      <DialogTitle>{editingStudentId ? "Edit Student" : "Register New Student"}</DialogTitle>
    </DialogHeader>
    <form onSubmit={submitStudent} className="space-y-4 mt-4">
      <div className="space-y-1">
        <Label>Full Name</Label>
        <Input value={studentForm.fullName} onChange={e => setStudentForm(p => ({...p, fullName: e.target.value}))} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Department</Label>
          <Input value={studentForm.department} onChange={e => setStudentForm(p => ({...p, department: e.target.value}))} />
        </div>
        <div className="space-y-1">
          <Label>Section</Label>
          <Input value={studentForm.section} onChange={e => setStudentForm(p => ({...p, section: e.target.value}))} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Email</Label>
        <Input type="email" value={studentForm.email} onChange={e => setStudentForm(p => ({...p, email: e.target.value}))} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Batch</Label>
          <Input value={studentForm.batch} onChange={e => setStudentForm(p => ({...p, batch: e.target.value}))} />
        </div>
        <div className="space-y-1">
          <Label>Year</Label>
          <Input value={studentForm.class_year} onChange={e => setStudentForm(p => ({...p, class_year: e.target.value}))} />
        </div>
        <div className="space-y-1">
          <Label>Semester</Label>
          <Input value={studentForm.semester} onChange={e => setStudentForm(p => ({...p, semester: e.target.value}))} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmittingStudent}>
        {isSubmittingStudent ? "Saving..." : editingStudentId ? "Update Student" : "Register Student"}
      </Button>
    </form>
  </DialogContent>
</Dialog>
    </div>
  )
}
