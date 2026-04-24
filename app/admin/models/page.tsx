"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, GraduationCap, Layers3, Trash2, Pencil } from "lucide-react"

type Subject = { id: string; subject_name: string; subject_code: string }
type Teacher = { id: string; full_name: string; subject_id: string; username: string }
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

const emptyClassForm = {
  class_name: "",
  subject_id: "",
  teacher_id: "",
  start_date: "",
  end_date: "",
  day: "Monday",
  start_time: "10:00 AM",
  end_time: "11:00 AM",
  students: "",
}

export default function AdminModelsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
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
      const [subjectRes, teacherRes, classRes] = await Promise.all([
        fetch(`${API}/subjects`, { headers: authHeader }),
        fetch(`${API}/admin/teachers`, { headers: authHeader }),
        fetch(`${API}/classes`, { headers: authHeader }),
      ])

      if (!subjectRes.ok) throw new Error("Failed to load subjects")
      if (!teacherRes.ok) throw new Error("Failed to load teachers")
      if (!classRes.ok) throw new Error("Failed to load classes")

      setSubjects(await subjectRes.json())
      setTeachers(await teacherRes.json())
      setClasses(await classRes.json())
    } catch (error: any) {
      toast.error(error.message || "Could not load data")
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
          schedule: [{ day: classForm.day, start_time: classForm.start_time, end_time: classForm.end_time }],
        },
        students: classForm.students
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
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

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-slate-300">Loading admin data...</div>
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-white mb-2">Manage Academic Models</h1>
      <p className="text-sm text-slate-400 mb-6">Create, update, and delete Subjects, Teachers, and Classes from one page.</p>

      <Tabs defaultValue="subjects">
        <TabsList className="grid grid-cols-3 mb-6 h-12 bg-white/5 border border-white/5 rounded-2xl p-1">
          <TabsTrigger value="subjects" className="rounded-xl"><BookOpen size={14} className="mr-2" />Subjects</TabsTrigger>
          <TabsTrigger value="teachers" className="rounded-xl"><GraduationCap size={14} className="mr-2" />Teachers</TabsTrigger>
          <TabsTrigger value="classes" className="rounded-xl"><Layers3 size={14} className="mr-2" />Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <Card className="bg-card/40 border-white/5">
            <CardHeader><CardTitle>Subject Form</CardTitle></CardHeader>
            <CardContent>
              <form className="grid md:grid-cols-3 gap-3" onSubmit={submitSubject}>
                <Input placeholder="Subject Name" value={subjectForm.subject_name} onChange={(e) => setSubjectForm((p) => ({ ...p, subject_name: e.target.value }))} required />
                <Input placeholder="Subject Code" value={subjectForm.subject_code} onChange={(e) => setSubjectForm((p) => ({ ...p, subject_code: e.target.value }))} required />
                <Button type="submit">{editingSubjectId ? "Update Subject" : "Create Subject"}</Button>
              </form>
            </CardContent>
          </Card>
          {subjects.map((s) => (
            <Card key={s.id} className="bg-card/30 border-white/5">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{s.subject_name}</p>
                  <p className="text-xs text-slate-400">{s.subject_code}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingSubjectId(s.id); setSubjectForm({ subject_name: s.subject_name, subject_code: s.subject_code }) }}><Pencil size={14} /></Button>
                  <Button variant="destructive" size="sm" onClick={() => removeItem("subjects", s.id)}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card className="bg-card/40 border-white/5">
            <CardHeader><CardTitle>Teacher Form</CardTitle></CardHeader>
            <CardContent>
              <form className="grid md:grid-cols-2 gap-3" onSubmit={submitTeacher}>
                <Input placeholder="Full Name" value={teacherForm.full_name} onChange={(e) => setTeacherForm((p) => ({ ...p, full_name: e.target.value }))} required />
                <Input placeholder="Username" value={teacherForm.username} onChange={(e) => setTeacherForm((p) => ({ ...p, username: e.target.value }))} required />
                <Select value={teacherForm.subject_id} onValueChange={(v) => setTeacherForm((p) => ({ ...p, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder={editingTeacherId ? "New Password (optional)" : "Password"} type="password" value={teacherForm.password} onChange={(e) => setTeacherForm((p) => ({ ...p, password: e.target.value }))} required={!editingTeacherId} />
                <Button type="submit" className="md:col-span-2">{editingTeacherId ? "Update Teacher" : "Create Teacher"}</Button>
              </form>
            </CardContent>
          </Card>
          {teachers.map((t) => (
            <Card key={t.id} className="bg-card/30 border-white/5">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{t.full_name}</p>
                  <p className="text-xs text-slate-400">{t.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingTeacherId(t.id); setTeacherForm({ full_name: t.full_name, subject_id: t.subject_id, username: t.username, password: "" }) }}><Pencil size={14} /></Button>
                  <Button variant="destructive" size="sm" onClick={() => removeItem("teachers", t.id)}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card className="bg-card/40 border-white/5">
            <CardHeader><CardTitle>Class Form</CardTitle></CardHeader>
            <CardContent>
              <form className="grid md:grid-cols-2 gap-3" onSubmit={submitClass}>
                <Input placeholder="Class Name" value={classForm.class_name} onChange={(e) => setClassForm((p) => ({ ...p, class_name: e.target.value }))} required />
                <Select value={classForm.subject_id} onValueChange={(v) => setClassForm((p) => ({ ...p, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={classForm.teacher_id} onValueChange={(v) => setClassForm((p) => ({ ...p, teacher_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">Start Date</Label>
                    <Input type="datetime-local" value={classForm.start_date} onChange={(e) => setClassForm((p) => ({ ...p, start_date: e.target.value }))} required />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">End Date</Label>
                    <Input type="datetime-local" value={classForm.end_date} onChange={(e) => setClassForm((p) => ({ ...p, end_date: e.target.value }))} required />
                  </div>
                </div>
                <Select value={classForm.day} onValueChange={(v) => setClassForm((p) => ({ ...p, day: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Start Time (e.g. 10:00 AM)" value={classForm.start_time} onChange={(e) => setClassForm((p) => ({ ...p, start_time: e.target.value }))} required />
                <Input placeholder="End Time (e.g. 11:30 AM)" value={classForm.end_time} onChange={(e) => setClassForm((p) => ({ ...p, end_time: e.target.value }))} required />
                <Input className="md:col-span-2" placeholder="Student IDs (comma separated)" value={classForm.students} onChange={(e) => setClassForm((p) => ({ ...p, students: e.target.value }))} />
                <Button type="submit" className="md:col-span-2">{editingClassId ? "Update Class" : "Create Class"}</Button>
              </form>
            </CardContent>
          </Card>
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
                      const first = c.schedule?.schedule?.[0]
                      setEditingClassId(c.id)
                      setClassForm({
                        class_name: c.class_name,
                        subject_id: c.subject_id,
                        teacher_id: c.teacher_id,
                        start_date: c.start_date.slice(0, 16),
                        end_date: c.end_date.slice(0, 16),
                        day: first?.day || "Monday",
                        start_time: first?.start_time || "10:00 AM",
                        end_time: first?.end_time || "11:00 AM",
                        students: c.students.join(", "),
                      })
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => removeItem("classes", c.id)}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
