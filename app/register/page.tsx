"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Camera, Check, User, Shield, Mail, BookOpen, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LivenessCheck } from "@/components/LivenessCheck"

// Webcam Capture Component
const WebcamCapture = ({
  onCapture,
  showLiveness,
  onLivenessComplete,
}: {
  onCapture: (imageSrc: string | null) => void
  showLiveness?: boolean
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
      // Capture the image after successful liveness check
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
    <div className="flex flex-col items-center gap-4">
      <div className="border rounded-lg overflow-hidden w-full max-w-md aspect-video">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "user",
          }}
          className="w-full h-full object-cover"
        />
      </div>
      
      {livenessPassed ? (
        <Alert className="bg-green-50 dark:bg-green-900/20">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Liveness Verified</AlertTitle>
          <AlertDescription>Your face has been verified as real.</AlertDescription>
        </Alert>
      ) : (
        <Button onClick={() => setShowLivenessCheck(true)}>
          <Shield className="mr-2 h-4 w-4" />
          Start Liveness Check
        </Button>
      )}
      
      {livenessPassed && (
        <Button onClick={capture} variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Capture Image (Optional)
        </Button>
      )}
    </div>
  )
}

// Main Registration Page Component
export default function FaceRegistrationPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [livenessVerified, setLivenessVerified] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",        // Changed from name
    studentID: "",       // Changed from student_id
    department: "",      // New field
    section: "",         // New field
    email: "",           // New field
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
    return email === "" || emailRegex.test(email) // Empty is allowed (optional field)
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
      // Convert base64 image to blob/file
      const base64Data = capturedImage.includes(',') 
        ? capturedImage.split(',')[1] 
        : capturedImage
      
      const byteCharacters = atob(base64Data)
      const byteArrays = []
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i))
      }
      
      const byteArray = new Uint8Array(byteArrays)
      const blob = new Blob([byteArray], { type: 'image/jpeg' })
      const file = new File([blob], 'face.jpg', { type: 'image/jpeg' })

      // Create FormData with exact field names matching backend
      const formDataToSend = new FormData()
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('studentID', formData.studentID)
      
      // Only append optional fields if they have values
      if (formData.department) {
        formDataToSend.append('department', formData.department)
      }
      
      if (formData.section) {
        formDataToSend.append('section', formData.section)
      }
      
      if (formData.email) {
        formDataToSend.append('email', formData.email)
      }
      
      formDataToSend.append('image', file)

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
      
      // Show success message
      setIsRegistered(true)
      
      // Reset form
      setFormData({ 
        fullName: "", 
        studentID: "", 
        department: "",
        section: "",
        email: ""
      })
      setCapturedImage(null)
      setLivenessVerified(false)
      setActiveTab("capture")
      
    } catch (error: any) {
      console.error("Error registering user:", error)
      setError(error.message || "Failed to register user. Please try again.")
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Face Registration System</h1>

      {isRegistered ? (
        <Card className="w-full">
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              <CardTitle>Registration Successful</CardTitle>
            </div>
            <CardDescription>Your face has been registered successfully.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              {capturedImage && (
                <div className="border rounded-lg overflow-hidden w-64 h-64">
                  <img
                    src={capturedImage || "/placeholder.svg"}
                    alt="Registered face"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-center space-y-2">
                <p className="font-medium text-lg">{formData.fullName}</p>
                <p className="text-sm text-muted-foreground">Student ID: {formData.studentID}</p>
                {formData.department && (
                  <p className="text-sm text-muted-foreground">Department: {formData.department}</p>
                )}
                {formData.section && (
                  <p className="text-sm text-muted-foreground">Section: {formData.section}</p>
                )}
                {formData.email && (
                  <p className="text-sm text-muted-foreground">Email: {formData.email}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => {
                setCapturedImage(null)
                setLivenessVerified(false)
                setFormData({ 
                  fullName: "", 
                  studentID: "", 
                  department: "", 
                  section: "", 
                  email: "" 
                })
                setIsRegistered(false)
                setActiveTab("capture")
                setError(null)
              }}
            >
              Register Another Student
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="capture" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="capture">
              <Camera className="mr-2 h-4 w-4" />
              Capture & Verify
            </TabsTrigger>
            <TabsTrigger value="info">
              <User className="mr-2 h-4 w-4" />
              Student Information
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capture" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Face Capture & Liveness Verification</CardTitle>
                <CardDescription>
                  First, we'll verify you're a real person, then capture your face image.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  {!capturedImage ? (
                    <WebcamCapture 
                      onCapture={setCapturedImage} 
                      showLiveness={true}
                      onLivenessComplete={handleLivenessComplete}
                    />
                  ) : (
                    <div className="border rounded-lg overflow-hidden w-full max-w-md aspect-video">
                      <img
                        src={capturedImage || "/placeholder.svg"}
                        alt="Captured face"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Liveness Check Tips</AlertTitle>
                    <AlertDescription>
                      You'll be asked to perform several actions to prove you're a real person.
                      Make sure your face is clearly visible and well-lit.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                {capturedImage && (
                  <>
                    <Button variant="outline" onClick={retakeImage}>
                      Retake
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("info")}
                      disabled={!livenessVerified}
                    >
                      {livenessVerified ? "Continue to Student Info" : "Complete Liveness Check First"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>Enter your details to complete the registration.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentID" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Student ID *
                    </Label>
                    <Input
                      id="studentID"
                      name="studentID"
                      placeholder="Enter your student ID"
                      value={formData.studentID}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      name="department"
                      placeholder="Enter your department (optional)"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Section
                    </Label>
                    <Input
                      id="section"
                      name="section"
                      placeholder="Enter your section (optional)"
                      value={formData.section}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email (optional)"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  {capturedImage ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={capturedImage || "/placeholder.svg"}
                          alt="Captured face"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">Face Image Captured</p>
                        <p className="text-sm text-muted-foreground">
                          Liveness Status: {livenessVerified ? (
                            <span className="text-green-600 font-medium">Verified ✓</span>
                          ) : (
                            <span className="text-red-600 font-medium">Not Verified</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("capture")}>
                            Click here to retake
                          </Button>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Face Image Required</AlertTitle>
                      <AlertDescription>
                        Please complete the liveness check and capture your face image before registering.
                        <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setActiveTab("capture")}>
                          Go to capture
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isRegistering || !capturedImage || !livenessVerified}
                  >
                    {isRegistering ? (
                      <>
                        <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Registering...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}