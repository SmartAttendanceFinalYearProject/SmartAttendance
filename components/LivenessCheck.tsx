"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, ArrowLeft, ArrowRight, Smile, Activity, RefreshCw } from "lucide-react"
import { loadFaceApiModels, checkHeadTurn, checkSmile, checkTongueOut, checkHeadShake, detectFace } from "@/lib/faceDetection"

interface LivenessCheckProps {
  onComplete: (success: boolean) => void
  onCancel: () => void
}

type LivenessStep = {
  id: string
  name: string
  instruction: string
  icon: React.ReactNode
  action: (videoElement: HTMLVideoElement, prevData?: any) => Promise<boolean | { success: boolean; data?: any }>
  timeout: number // seconds
}

export const LivenessCheck: React.FC<LivenessCheckProps> = ({ onComplete, onCancel }) => {
  const webcamRef = useRef<Webcam>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stepStatus, setStepStatus] = useState<'pending' | 'in-progress' | 'success' | 'failed'>('pending')
  const [progress, setProgress] = useState(0)
  const [shakePositions, setShakePositions] = useState<{ x: number; y: number }[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepStartRef = useRef<number>(0)
  const executingRef = useRef(false)
  const stepStatusRef = useRef(stepStatus)
  const activeStepIdRef = useRef<string | null>(null)

  useEffect(() => {
    stepStatusRef.current = stepStatus
  }, [stepStatus])

  const clearTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
      advanceTimeoutRef.current = null
    }
    executingRef.current = false
  }, [])


  // Define liveness check steps
  const steps: LivenessStep[] = [
    {
      id: 'initial',
      name: 'Initial Detection',
      instruction: 'Look straight at the camera',
      icon: <Activity className="h-5 w-5" />,
      action: async (videoElement) => {
        const detection = await detectFace(videoElement)
        return detection !== null
      },
      timeout: 5
    },
    {
      id: 'turn-left',
      name: 'Turn Left',
      instruction: 'Slowly turn your head to the LEFT',
      icon: <ArrowLeft className="h-5 w-5" />,
      action: async (videoElement) => checkHeadTurn(videoElement, 'left'),
      timeout: 5
    },
    {
      id: 'turn-right',
      name: 'Turn Right',
      instruction: 'Now turn your head to the RIGHT',
      icon: <ArrowRight className="h-5 w-5" />,
      action: async (videoElement) => checkHeadTurn(videoElement, 'right'),
      timeout: 5
    },
    {
      id: 'smile',
      name: 'Smile',
      instruction: 'Show us your beautiful smile!',
      icon: <Smile className="h-5 w-5" />,
      action: async (videoElement) => checkSmile(videoElement),
      timeout: 5
    },
    {
      id: 'tongue',
      name: 'Tongue Out',
      instruction: 'Stick out your tongue',
      icon: <RefreshCw className="h-5 w-5" />,
      action: async (videoElement) => checkTongueOut(videoElement),
      timeout: 5
    },
    {
      id: 'shake',
      name: 'Shake Head',
      instruction: 'Gently shake your head side to side',
      icon: <Activity className="h-5 w-5" />,
      action: async (videoElement, prevData) => {
        const result = await checkHeadShake(videoElement, prevData || [])
        return { success: result.detected, data: result.positions }
      },
      timeout: 8
    }
  ]

  
  const currentStep = steps[currentStepIndex]
  const [stepsReady, setStepsReady] = useState(false)
  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true)
      try {
        const loaded = await loadFaceApiModels()
        setModelsLoaded(loaded)
        if (!loaded) {
          setError('Failed to load face detection models. Please refresh and try again.')
        }
      } catch (err) {
        setError('Error loading face detection models')
      } finally {
        setLoading(false)
      }
    }
    
    loadModels()
  }, [])

   useEffect(() => {
    setStepsReady(true)
    }, [])


// Handle step execution
const executeStep = useCallback(async () => {
  if (!webcamRef.current || !webcamRef.current.video || !currentStep) return
  
  const video = webcamRef.current.video
  
  if (!video || video.readyState !== 4) {
    // Video not ready yet
    return
  }

  if (executingRef.current) return
  executingRef.current = true

  if (stepStatusRef.current === 'pending') {
    setStepStatus('in-progress')
  }
  
  try {
    let result
    if (currentStep.id === 'shake') {
      const shakeResult = await currentStep.action(video, shakePositions)
      result = shakeResult as { success: boolean; data: { x: number; y: number }[] }
      
      if (result.success) {
        setShakePositions([]) // Reset for next time
        setStepStatus('success')
        clearTimers()
        setProgress(100)
        setCountdown(0)
        const completedStepId = currentStep.id
        advanceTimeoutRef.current = setTimeout(() => {
          if (activeStepIdRef.current !== completedStepId) return
          if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
            setStepStatus('pending')
            setProgress(0)
            setCountdown(null)
          } else {
            // All steps completed
            onComplete(true)
          }
        }, 1000)
      } else {
        setShakePositions(result.data)
      }
    } else {
      result = await currentStep.action(video)
      
      if (result) {
        setStepStatus('success')
        clearTimers()
        setProgress(100)
        setCountdown(0)
        const completedStepId = currentStep.id
        advanceTimeoutRef.current = setTimeout(() => {
          if (activeStepIdRef.current !== completedStepId) return
          if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
            setStepStatus('pending')
            setProgress(0)
            setCountdown(null)
          } else {
            // All steps completed
            onComplete(true)
          }
        }, 1000)
      }
    }
  } catch (err) {
    console.error('Step execution error:', err)
    setStepStatus('failed')
    clearTimers()
  }
  finally {
    executingRef.current = false
  }
}, [clearTimers, currentStep, currentStepIndex, shakePositions, steps.length, onComplete])

// Timer and step execution loop (single runner; no stacked intervals)
useEffect(() => {
  if (!modelsLoaded || loading || !currentStep) return
  if (stepStatus !== 'pending' && stepStatus !== 'in-progress') return

  clearTimers()
  activeStepIdRef.current = currentStep.id
  stepStartRef.current = Date.now()
  setProgress(0)
  setCountdown(currentStep.timeout)

  progressIntervalRef.current = setInterval(() => {
    const elapsedSeconds = (Date.now() - stepStartRef.current) / 1000
    const remaining = Math.max(0, currentStep.timeout - elapsedSeconds)

    setCountdown(Math.ceil(remaining))
    setProgress(Math.min(100, (elapsedSeconds / currentStep.timeout) * 100))

    if (elapsedSeconds >= currentStep.timeout && stepStatusRef.current !== 'success') {
      setStepStatus('failed')
      clearTimers()
      setCountdown(0)
      setProgress(100)
    }
  }, 200)

  // Run checks periodically, but never overlap async executions.
  const tick = () => {
    if (stepStatusRef.current === 'pending' || stepStatusRef.current === 'in-progress') {
      void executeStep()
    }
  }

  tick()
  checkIntervalRef.current = setInterval(tick, 500)

  return () => {
    clearTimers()
  }
}, [clearTimers, currentStep, executeStep, loading, modelsLoaded, stepStatus])

  // Handle retry
  const handleRetry = () => {
    clearTimers()
    setStepStatus('pending')
    setProgress(0)
    setCountdown(null)
    if (currentStep.id === 'shake') {
      setShakePositions([])
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-medium">Loading face detection models...</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-4 w-full" onClick={onCancel}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!stepsReady) {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg font-medium">Preparing liveness check...</p>
        </div>
      </CardContent>
    </Card>
  )
}

return (
  <Card className="w-full">
    <CardHeader>
      <div className="flex items-center gap-2">
        {currentStep?.icon}
        <CardTitle>Liveness Check: {currentStep?.name || 'Loading...'}</CardTitle>
      </div>
      <CardDescription>
        Step {currentStepIndex + 1} of {steps.length}
      </CardDescription>
    </CardHeader>
    
    <CardContent className="space-y-4">
      <div className="border rounded-lg overflow-hidden w-full max-w-md mx-auto aspect-video">
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
      
      <div className="text-center">
        <p className="text-lg font-medium mb-2">{currentStep?.instruction || 'Waiting...'}</p>
        {countdown !== null && (
          <p className="text-sm text-muted-foreground">
            Time remaining: {countdown} seconds
          </p>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${
            stepStatus === 'success' ? 'bg-green-500' : 
            stepStatus === 'failed' ? 'bg-red-500' : 'bg-primary'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Status indicator */}
      {stepStatus === 'success' && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>Moving to next step...</AlertDescription>
        </Alert>
      )}
      
      {stepStatus === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed</AlertTitle>
          <AlertDescription>
            Could not verify this action. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
    
    <CardFooter className="flex justify-center gap-4">
      {stepStatus === 'failed' && (
        <Button onClick={handleRetry} variant="default">
          Try Again
        </Button>
      )}
      <Button onClick={onCancel} variant="outline">
        Cancel
      </Button>
    </CardFooter>
  </Card>
)
}