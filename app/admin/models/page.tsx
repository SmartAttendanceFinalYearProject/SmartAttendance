"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, GraduationCap, Layers3, Trash2, Pencil, Plus, X } from "lucide-react"

type Subject = { id: string; subject_name: string; subject_code: string }
type Teacher = { id: string; full_name: string; subject_id: string; username: string }
type Student = { id: string; fullName: string; studentID: string }
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
  const [loading, setLoading] = useState(true)

  const [subjectForm, setSubjectForm] = useState({ subject_name: "", subject_code: "" })
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)

  const [teacherForm, setTeacherForm] = useState({ full_name: "", subject_id: "", username: "", password: "" })
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null)

  const [classForm, setClassForm] = useState(emptyClassForm)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)

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
    }
  }

  const submitTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
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
    }
  }

  const submitClass = async (e: React.FormEvent) => {
    e.preventDefault()
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
    return <div className="container mx-auto px-4 py-8 text-slate-300">Loading admin data...</div>
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
        <div className="space-y-4 max-w-3xl mx-auto">
          {showForm ? (
            <Card className="bg-card/40 border-0">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Subject Form</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingSubjectId(null); setSubjectForm({ subject_name: "", subject_code: "" }); }}>
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
                  <Button type="submit" className="mt-1">
                    {editingSubjectId ? "Update Subject" : "Create Subject"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Subject</Button>
              </div>
              {subjects.map((s) => (
                <Card key={s.id} className="bg-card/30 border-white/5">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{s.subject_name}</p>
                      <p className="text-xs text-slate-400">{s.subject_code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingSubjectId(s.id); setSubjectForm({ subject_name: s.subject_name, subject_code: s.subject_code }); setShowForm(true); }}><Pencil size={14} /></Button>
                      <Button variant="destructive" size="sm" onClick={() => removeItem("subjects", s.id)}><Trash2 size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══════════════ TEACHERS TAB ══════════════ */}
      {activeTab === "teachers" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {showForm ? (
            <Card className="bg-card/40 border-0">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Teacher Form</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingTeacherId(null); setTeacherForm({ full_name: "", subject_id: "", username: "", password: "" }); }}>
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
                    <Input
                      placeholder={editingTeacherId ? "Leave blank to keep current" : "Password"}
                      type="password"
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm((p) => ({ ...p, password: e.target.value }))}
                      required={!editingTeacherId}
                    />
                  </div>
                  <Button type="submit" className="mt-1">
                    {editingTeacherId ? "Update Teacher" : "Create Teacher"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Teacher</Button>
              </div>
              {teachers.map((t) => (
                <Card key={t.id} className="bg-card/30 border-white/5">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{t.full_name}</p>
                      <p className="text-xs text-slate-400">{t.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingTeacherId(t.id); setTeacherForm({ full_name: t.full_name, subject_id: t.subject_id, username: t.username, password: "" }); setShowForm(true); }}><Pencil size={14} /></Button>
                      <Button variant="destructive" size="sm" onClick={() => removeItem("teachers", t.id)}><Trash2 size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══════════════ CLASSES TAB ══════════════ */}
      {activeTab === "classes" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {showForm ? (
            <Card className="bg-card/40 border-0">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Class Form</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingClassId(null); setClassForm(emptyClassForm); }}>
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
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    Students
                    {classForm.students.length > 0 && (
                      <span className="ml-2 text-blue-400 normal-case font-normal">
                        {classForm.students.length} selected
                      </span>
                    )}
                  </Label>

                  {/* Search */}
                  <Input
                    placeholder="Search students by name or ID…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500"
                  />

                  {students.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No registered students found.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 divide-y divide-white/5">
                      {students
                        .filter((s) =>
                          !studentSearch ||
                          s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.studentID.toLowerCase().includes(studentSearch.toLowerCase())
                        )
                        .map((s) => {
                          const checked = classForm.students.includes(s.id)
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
                                      ? p.students.filter((id) => id !== s.id)
                                      : [...p.students, s.id],
                                  }))
                                }}
                                className="accent-blue-500 h-4 w-4 flex-shrink-0"
                              />
                              <span className="flex-1 text-sm text-white">{s.fullName}</span>
                              <span className="text-xs text-slate-500">{s.studentID}</span>
                            </label>
                          )
                        })}
                    </div>
                  )}
                </div>

                <Button type="submit" className="mt-1">
                  {editingClassId ? "Update Class" : "Create Class"}
                </Button>
              </form>
            </CardContent>
          </Card>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Create Class</Button>
              </div>
              {classes.map((c) => (
                <Card key={c.id} className="bg-card/30 border-white/5">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{c.class_name}</p>
                      <p className="text-xs text-slate-400">{c.teacher_name} • Students: {c.student_count}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
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
                      <Button variant="destructive" size="sm" onClick={() => removeItem("classes", c.id)}><Trash2 size={14} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
