"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Camera, Check, User, Shield } from "lucide-react"
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
    name: "",
    email: "",
    userId: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!capturedImage) {
      setError("Please capture your face image before registering")
      return
    }

    if (!livenessVerified) {
      setError("Please complete the liveness check to verify you're a real person")
      return
    }

    if (!formData.name || !formData.email || !formData.userId) {
      setError("Please fill in all fields")
      return
    }

    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      let base64Image = ""
      if (capturedImage) {
        const match = capturedImage.match(/^data:image\/\w+;base64,(.+)$/)
        base64Image = match ? match[1] : capturedImage
      }

      const registrationData = {
        student_id: formData.userId,
        name: formData.name,
        face_image: base64Image,
      }

      const response = await fetch("http://localhost:8000/students/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Registration failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("Registration successful:", result)
      setIsRegistered(true)
      setFormData({ name: "", email: "", userId: "" })
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
              <div className="text-center">
                <p className="font-medium text-lg">{formData.name}</p>
                <p className="text-muted-foreground">{formData.email}</p>
                <p className="text-sm text-muted-foreground">User ID: {formData.userId}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => {
                setCapturedImage(null)
                setLivenessVerified(false)
                setFormData({ name: "", email: "", userId: "" })
                setIsRegistered(false)
                setActiveTab("capture")
                setError(null)
              }}
            >
              Register Another User
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
              User Information
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
                      {livenessVerified ? "Continue to User Info" : "Complete Liveness Check First"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
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
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      name="userId"
                      placeholder="Enter a unique user ID"
                      value={formData.userId}
                      onChange={handleInputChange}
                      required
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