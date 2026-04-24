"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CircleAlert as AlertCircle, Camera, Check, User, Shield, Mail, BookOpen, Users, RotateCcw, ArrowRight, Calendar, Hash, BarChart3 } from "lucide-react"
import { LivenessCheck } from "@/components/LivenessCheck"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const WebcamCapture = ({
  onCapture,
  onLivenessComplete,
}: {
  onCapture: (imageSrc: string | null) => void
  onLivenessComplete?: (success: boolean) => void
}) => {
  const webcamRef = useRef<Webcam>(null)
  const [showLivenessCheck, setShowLivenessCheck] = useState(false)
  const [livenessPassed, setLivenessPassed] = useState(false)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot() || null
    onCapture(imageSrc)
  }, [onCapture])

  const handleLivenessComplete = (success: boolean) => {
    setShowLivenessCheck(false)
    if (success) {
      setLivenessPassed(true)
      setTimeout(() => {
        capture()
        if (onLivenessComplete) onLivenessComplete(true)
      }, 500)
    } else {
      if (onLivenessComplete) onLivenessComplete(false)
    }
  }

  if (showLivenessCheck) {
    return (
      <LivenessCheck
        onComplete={handleLivenessComplete}
        onCancel={() => setShowLivenessCheck(false)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative rounded-xl overflow-hidden w-full max-w-md aspect-video border border-border bg-slate-950">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          className="w-full h-full object-cover"
        />
      </div>

      {livenessPassed ? (
        <div className="flex items-center gap-3 w-full max-w-md px-5 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 flex-shrink-0">
            <Check size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">Liveness Verified</p>
            <p className="text-xs text-emerald-500/70 font-medium">Identity confirmed successfully</p>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowLivenessCheck(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 rounded-xl px-6 shadow-lg shadow-blue-500/20"
        >
          <Shield size={16} />
          Start Liveness Check
        </Button>
      )}

      {livenessPassed && (
        <Button onClick={capture} variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl">
          <Camera size={14} />
          Recapture Image
        </Button>
      )}
    </div>
  )
}

export default function AdminRegistrationPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [livenessVerified, setLivenessVerified] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    studentID: "",
    department: "",
    section: "",
    email: "",
    batch: "",
    class_year: "1st",
    semester: "1st",
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [activeTab, setActiveTab] = useState("capture")
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const retakeImage = () => {
    setCapturedImage(null)
    setLivenessVerified(false)
    setError(null)
  }

  const handleLivenessComplete = (success: boolean) => {
    setLivenessVerified(success)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return email === "" || emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!capturedImage) {
      setError("Please capture your face image before registering")
      return
    }

    if (!livenessVerified) {
      setError("Please complete the liveness check to verify you're a real person")
      return
    }

    if (!formData.fullName || !formData.studentID) {
      setError("Full Name and Student ID are required fields")
      return
    }

    if (formData.email && !validateEmail(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      const base64Data = capturedImage.includes(",")
        ? capturedImage.split(",")[1]
        : capturedImage

      const byteCharacters = atob(base64Data)
      const byteArrays = []

      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i))
      }

      const byteArray = new Uint8Array(byteArrays)
      const blob = new Blob([byteArray], { type: "image/jpeg" })
      const file = new File([blob], "face.jpg", { type: "image/jpeg" })

      const formDataToSend = new FormData()
      formDataToSend.append("fullName", formData.fullName)
      formDataToSend.append("studentID", formData.studentID)

      if (formData.department) formDataToSend.append("department", formData.department)
      if (formData.section) formDataToSend.append("section", formData.section)
      if (formData.email) formDataToSend.append("email", formData.email)
      formDataToSend.append("batch", formData.batch)
      formDataToSend.append("class_year", formData.class_year)
      formDataToSend.append("semester", formData.semester)

      formDataToSend.append("image", file)

      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        body: formDataToSend,
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Registration failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("Registration successful:", result)

      setIsRegistered(true)

      setFormData({
        fullName: "",
        studentID: "",
        department: "",
        section: "",
        email: "",
        batch: "",
        class_year: "1st",
        semester: "1st",
      })
      setCapturedImage(null)
      setLivenessVerified(false)
      setActiveTab("capture")
    } catch (error: unknown) {
      console.error("Error registering user:", error)
      const message = error instanceof Error ? error.message : "Failed to register user. Please try again."
      setError(message)
    } finally {
      setIsRegistering(false)
    }
  }

  if (isRegistered) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-lg">
        <div className="rounded-2xl border border-white/5 bg-card shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="px-6 py-6 bg-emerald-500/10 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20">
                <Check size={24} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Registration Successful</h2>
                <p className="text-sm text-emerald-400/80 font-medium">Student data has been securely saved</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center gap-6">
              {capturedImage && (
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-xl">
                  <img src={capturedImage} alt="Registered face" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-sm font-medium text-slate-400">Full Name</span>
                  <span className="text-sm font-bold text-white">{formData.fullName}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-sm font-medium text-slate-400">Student ID</span>
                  <span className="text-sm font-bold text-blue-400 font-mono tracking-wider">{formData.studentID}</span>
                </div>
                {formData.department && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Department</span>
                    <span className="text-sm font-bold text-white">{formData.department}</span>
                  </div>
                )}
                {formData.email && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Email</span>
                    <span className="text-sm font-bold text-white">{formData.email}</span>
                  </div>
                )}
                {formData.batch && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-sm font-medium text-slate-400">Batch / Year</span>
                    <span className="text-sm font-bold text-white">{formData.batch} ({formData.class_year})</span>
                  </div>
                )}
                {formData.semester && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-slate-400">Semester</span>
                    <span className="text-sm font-bold text-white">{formData.semester}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <Button
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/20"
              onClick={() => {
                setCapturedImage(null)
                setLivenessVerified(false)
                setFormData({ fullName: "", studentID: "", department: "", section: "", email: "", batch: "", class_year: "1st", semester: "1st" })
                setIsRegistered(false)
                setActiveTab("capture")
                setError(null)
              }}
            >
              Register Another Student
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Student Registration
        </h1>
        <p className="text-sm text-muted-foreground">
          Register a new student with facial recognition verification
        </p>
      </div>

      <Tabs defaultValue="capture" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-white/5 border border-white/5 rounded-2xl p-1 backdrop-blur-md">
          <TabsTrigger value="capture" className="gap-2 text-sm font-semibold rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <Camera size={14} />
            Capture & Verify
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2 text-sm font-semibold rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <User size={14} />
            Student Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="mt-0 outline-none">
          <div className="rounded-2xl border border-white/5 bg-card shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="px-5 py-4 border-b border-white/5 bg-white/5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Face Capture & Verification</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete the automated liveness check for security
              </p>
            </div>

            <div className="p-5">
              <div className="flex flex-col items-center gap-4">
                {!capturedImage ? (
                  <WebcamCapture
                    onCapture={setCapturedImage}
                    onLivenessComplete={handleLivenessComplete}
                  />
                ) : (
                  <div className="relative rounded-xl overflow-hidden w-full max-w-md aspect-video border border-border">
                    <img
                      src={capturedImage}
                      alt="Captured face"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-start gap-3 w-full p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 max-w-md">
                  <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-tight">Requirement Checklist</p>
                    <p className="text-[11px] text-blue-100/70 mt-1 leading-relaxed">
                      Maintain neutral expression. Ensure high lighting on face. Perform requested head movements naturally.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {capturedImage && (
              <div className="px-6 pb-6 flex justify-center gap-4">
                <Button variant="outline" onClick={retakeImage} size="sm" className="gap-2 border-white/10 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl">
                  <RotateCcw size={14} />
                  Retake Video
                </Button>
                <Button
                  onClick={() => setActiveTab("info")}
                  disabled={!livenessVerified}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                >
                  {livenessVerified ? "Continue Registration" : "Verify Identity First"}
                  {livenessVerified && <ArrowRight size={14} />}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-0 outline-none">
          <div className="rounded-2xl border border-white/5 bg-card shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="px-5 py-4 border-b border-white/5 bg-white/5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Student Profile Details</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete the form to finalize enrollment
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-300">{error}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <User size={12} className="text-blue-400" />
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white rounded-xl focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentID" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <BookOpen size={12} className="text-blue-400" />
                      Student ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="studentID"
                      name="studentID"
                      placeholder="e.g. STU-2024-001"
                      value={formData.studentID}
                      onChange={handleInputChange}
                      required
                      className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white font-mono rounded-xl focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <Users size={12} className="text-blue-400" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      name="department"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <Users size={12} className="text-blue-400" />
                      Section
                    </Label>
                    <Input
                      id="section"
                      name="section"
                      placeholder="e.g. CS-A"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <Mail size={12} className="text-blue-400" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@university.edu"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white rounded-xl"
                    />
                  </div>

                  {/* Academic Info Divider */}
                  <div className="sm:col-span-2 pt-2 pb-1 border-b border-white/5">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest px-1">Academic Details</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <Hash size={12} className="text-blue-400" />
                      Batch / Enrollment Year <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="batch"
                      name="batch"
                      placeholder="e.g. 2024"
                      value={formData.batch}
                      onChange={handleInputChange}
                      required
                      className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white rounded-xl focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class_year" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <Calendar size={12} className="text-blue-400" />
                      Class Year <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.class_year} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, class_year: value }))}
                    >
                      <SelectTrigger className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="1st">1st Year</SelectItem>
                        <SelectItem value="2nd">2nd Year</SelectItem>
                        <SelectItem value="3rd">3rd Year</SelectItem>
                        <SelectItem value="4th">4th Year</SelectItem>
                        <SelectItem value="5th">5th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-1">
                      <BarChart3 size={12} className="text-blue-400" />
                      Semester <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.semester} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                    >
                      <SelectTrigger className="h-11 bg-white/5 backdrop-blur-sm border-white/10 text-white rounded-xl">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="1st">1st Semester</SelectItem>
                        <SelectItem value="2nd">2nd Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {capturedImage ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-blue-500/30 shadow-lg flex-shrink-0">
                      <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">Identity Matrix Confirmed</p>
                      <div className="flex items-center gap-2 mt-1">
                        {livenessVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check size={12} /> Secure Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <AlertCircle size={12} /> Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("capture")}
                      className="text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg h-8"
                    >
                      Swap
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-400 uppercase tracking-tight">Biometric Step Required</p>
                      <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                        Security protocols require you to <button type="button" onClick={() => setActiveTab("capture")} className="text-white underline font-bold hover:text-white/80">authenticate via camera</button> before finishing.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 pt-2">
                <Button
                  type="submit"
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-2xl shadow-xl shadow-blue-600/20"
                  disabled={isRegistering || !capturedImage || !livenessVerified}
                >
                  {isRegistering ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering Biometrics...
                    </>
                  ) : (
                    <>
                      Confirm Enrollment
                      <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
