"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CircleAlert as AlertCircle, Camera, Check, User, Shield, Mail, BookOpen, Users, RotateCcw, ArrowRight } from "lucide-react"
import { LivenessCheck } from "@/components/LivenessCheck"

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
        <div className="flex items-center gap-2.5 w-full max-w-md px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 flex-shrink-0">
            <Check size={14} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">Liveness Verified</p>
            <p className="text-xs text-emerald-600">Your face has been verified as real</p>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowLivenessCheck(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
        >
          <Shield size={14} />
          Start Liveness Check
        </Button>
      )}

      {livenessPassed && (
        <Button onClick={capture} variant="outline" size="sm" className="gap-2">
          <Camera size={13} />
          Recapture Image
        </Button>
      )}
    </div>
  )
}

export default function FaceRegistrationPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [livenessVerified, setLivenessVerified] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    studentID: "",
    department: "",
    section: "",
    email: "",
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
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-lg">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
                <Check size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-emerald-900">Registration Successful</h2>
                <p className="text-sm text-emerald-700">Student has been registered successfully</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center gap-5">
              {capturedImage && (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-sm">
                  <img src={capturedImage} alt="Registered face" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <span className="text-sm font-medium">{formData.fullName}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">Student ID</span>
                  <span className="text-sm font-medium font-mono">{formData.studentID}</span>
                </div>
                {formData.department && (
                  <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">Department</span>
                    <span className="text-sm font-medium">{formData.department}</span>
                  </div>
                )}
                {formData.section && (
                  <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">Section</span>
                    <span className="text-sm font-medium">{formData.section}</span>
                  </div>
                )}
                {formData.email && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{formData.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <Button
              className="w-full gap-2"
              onClick={() => {
                setCapturedImage(null)
                setLivenessVerified(false)
                setFormData({ fullName: "", studentID: "", department: "", section: "", email: "" })
                setIsRegistered(false)
                setActiveTab("capture")
                setError(null)
              }}
            >
              Register Another Student
              <ArrowRight size={14} />
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
        <TabsList className="grid w-full grid-cols-2 mb-5 h-10">
          <TabsTrigger value="capture" className="gap-2 text-sm">
            <Camera size={13} />
            Capture & Verify
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2 text-sm">
            <User size={13} />
            Student Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="mt-0">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="text-sm font-semibold">Face Capture & Liveness Verification</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete the liveness check to verify your identity
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

                <div className="flex items-start gap-3 w-full p-3.5 rounded-lg bg-blue-50 border border-blue-100 max-w-md">
                  <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">Liveness Check Tips</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      You&apos;ll be asked to perform several actions to prove you&apos;re a real person. Ensure your face is well-lit.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {capturedImage && (
              <div className="px-5 pb-5 flex justify-center gap-3">
                <Button variant="outline" onClick={retakeImage} size="sm" className="gap-2">
                  <RotateCcw size={13} />
                  Retake
                </Button>
                <Button
                  onClick={() => setActiveTab("info")}
                  disabled={!livenessVerified}
                  size="sm"
                  className="gap-2"
                >
                  {livenessVerified ? "Continue to Student Info" : "Complete Liveness Check First"}
                  {livenessVerified && <ArrowRight size={13} />}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-0">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="text-sm font-semibold">Student Information</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter student details to complete registration
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-medium flex items-center gap-1.5">
                      <User size={12} className="text-muted-foreground" />
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="studentID" className="text-xs font-medium flex items-center gap-1.5">
                      <BookOpen size={12} className="text-muted-foreground" />
                      Student ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="studentID"
                      name="studentID"
                      placeholder="Enter student ID"
                      value={formData.studentID}
                      onChange={handleInputChange}
                      required
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-xs font-medium flex items-center gap-1.5">
                      <Users size={12} className="text-muted-foreground" />
                      Department
                      <span className="text-muted-foreground/60 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="department"
                      name="department"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section" className="text-xs font-medium flex items-center gap-1.5">
                      <Users size={12} className="text-muted-foreground" />
                      Section
                      <span className="text-muted-foreground/60 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="section"
                      name="section"
                      placeholder="e.g. Section A"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
                      <Mail size={12} className="text-muted-foreground" />
                      Email
                      <span className="text-muted-foreground/60 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {capturedImage ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-lg border bg-muted/20">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-border flex-shrink-0">
                      <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Face Image Captured</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {livenessVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            <Check size={10} /> Liveness Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                            <AlertCircle size={10} /> Not Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("capture")}
                      className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      Retake
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-800">Face Image Required</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Please{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("capture")}
                          className="underline font-medium hover:text-red-800"
                        >
                          complete the liveness check
                        </button>{" "}
                        before submitting.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isRegistering || !capturedImage || !livenessVerified}
                >
                  {isRegistering ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Registering...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <ArrowRight size={14} />
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