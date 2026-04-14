"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { CircleAlert as AlertCircle, Check, ArrowLeft, ArrowRight, Smile, Activity, RefreshCw, X } from "lucide-react"
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
  action: (videoElement: HTMLVideoElement, prevData?: ShakePosition[]) => Promise<boolean | { success: boolean; data?: ShakePosition[] }>
  timeout: number
}

type ShakePosition = {
  x: number
  y: number
}

export const LivenessCheck: React.FC<LivenessCheckProps> = ({ onComplete, onCancel }) => {
  const webcamRef = useRef<Webcam>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stepStatus, setStepStatus] = useState<"pending" | "in-progress" | "success" | "failed">("pending")
  const [progress, setProgress] = useState(0)
  const [shakePositions, setShakePositions] = useState<ShakePosition[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepStartRef = useRef<number>(0)
  const executingRef = useRef(false)
  const stepStatusRef = useRef(stepStatus)

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
    executingRef.current = false
  }, [])

  const steps: LivenessStep[] = [
    {
      id: "initial",
      name: "Initial Detection",
      instruction: "Look straight at the camera",
      icon: <Activity size={18} />,
      action: async (videoElement) => {
        const detection = await detectFace(videoElement)
        return detection !== null
      },
      timeout: 5,
    },
    {
      id: "turn-left",
      name: "Turn Left",
      instruction: "Slowly turn your head to the LEFT",
      icon: <ArrowLeft size={18} />,
      action: async (videoElement) => checkHeadTurn(videoElement, "left"),
      timeout: 5,
    },
    {
      id: "turn-right",
      name: "Turn Right",
      instruction: "Now turn your head to the RIGHT",
      icon: <ArrowRight size={18} />,
      action: async (videoElement) => checkHeadTurn(videoElement, "right"),
      timeout: 5,
    },
    {
      id: "smile",
      name: "Smile",
      instruction: "Show us your beautiful smile!",
      icon: <Smile size={18} />,
      action: async (videoElement) => checkSmile(videoElement),
      timeout: 5,
    },
    {
      id: "tongue",
      name: "Tongue Out",
      instruction: "Stick out your tongue",
      icon: <RefreshCw size={18} />,
      action: async (videoElement) => checkTongueOut(videoElement),
      timeout: 5,
    },
    {
      id: "shake",
      name: "Shake Head",
      instruction: "Gently shake your head side to side",
      icon: <Activity size={18} />,
      action: async (videoElement, prevData) => {
        const result = await checkHeadShake(videoElement, prevData || [])
        return { success: result.detected, data: result.positions }
      },
      timeout: 8,
    },
  ]

  const currentStep = steps[currentStepIndex]

  useEffect(() => {
    const loadModels = async () => {
      setLoading(true)
      try {
        const loaded = await loadFaceApiModels()
        setModelsLoaded(loaded)
        if (!loaded) {
          setError("Failed to load face detection models. Please refresh and try again.")
        }
      } catch {
        setError("Error loading face detection models")
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [])

  const executeStep = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video || !currentStep) return
    const video = webcamRef.current.video
    if (!video || video.readyState !== 4) return
    if (executingRef.current) return
    executingRef.current = true

    if (stepStatusRef.current === "pending") {
      setStepStatus("in-progress")
    }

    try {
      let result
      if (currentStep.id === "shake") {
        const shakeResult = await currentStep.action(video, shakePositions)
        result = shakeResult as { success: boolean; data: ShakePosition[] }
        if (result.success) {
          setShakePositions([])
          setStepStatus("success")
          clearTimers()
          setProgress(100)
          setCountdown(0)
        } else {
          setShakePositions(result.data)
        }
      } else {
        result = await currentStep.action(video)
        if (result) {
          setStepStatus("success")
          clearTimers()
          setProgress(100)
          setCountdown(0)
        }
      }
    } catch (err) {
      console.error("Step execution error:", err)
      setStepStatus("failed")
      clearTimers()
    } finally {
      executingRef.current = false
    }
  }, [clearTimers, currentStep, shakePositions])

  const handleNextStep = () => {
    if (stepStatus !== "success") return
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
      setStepStatus("pending")
      setProgress(0)
      setCountdown(null)
      setShakePositions([])
    } else {
      onComplete(true)
    }
  }

  useEffect(() => {
    if (!modelsLoaded || loading || !currentStep) return
    if (stepStatus !== "pending" && stepStatus !== "in-progress") return

    clearTimers()
    stepStartRef.current = Date.now()
    setProgress(0)
    setCountdown(currentStep.timeout)

    progressIntervalRef.current = setInterval(() => {
      const elapsedSeconds = (Date.now() - stepStartRef.current) / 1000
      const remaining = Math.max(0, currentStep.timeout - elapsedSeconds)
      setCountdown(Math.ceil(remaining))
      setProgress(Math.min(100, (elapsedSeconds / currentStep.timeout) * 100))

      if (elapsedSeconds >= currentStep.timeout && stepStatusRef.current !== "success") {
        setStepStatus("failed")
        clearTimers()
        setCountdown(0)
        setProgress(100)
      }
    }, 200)

    const tick = () => {
      if (stepStatusRef.current === "pending" || stepStatusRef.current === "in-progress") {
        void executeStep()
      }
    }

    tick()
    checkIntervalRef.current = setInterval(tick, 500)
    return () => clearTimers()
  }, [clearTimers, currentStep, executeStep, loading, modelsLoaded, stepStatus])

  const handleRetry = () => {
    clearTimers()
    setStepStatus("pending")
    setProgress(0)
    setCountdown(null)
    setShakePositions([])
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-card border rounded-xl shadow-sm">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-base font-semibold text-foreground">Loading Analysis Models</p>
        <p className="text-xs text-muted-foreground mt-1">Preparing secure facial verification...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-card border rounded-xl shadow-sm">
        <div className="flex items-center gap-3 text-red-600 mb-4 font-medium">
          <AlertCircle size={20} />
          <span>Verification Error</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Button className="w-full" onClick={onCancel} variant="outline">
          Return to Registration
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-lg overflow-hidden max-w-md mx-auto">
      <div className="px-5 py-3.5 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Liveness Challenge</span>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      <div className="p-5">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-5 shadow-inner">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 border-[20px] border-slate-950/20 pointer-events-none" />

          {/* Verification Overlays */}
          {stepStatus === "success" && (
            <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-in zoom-in duration-300">
                <Check size={32} />
              </div>
            </div>
          )}

          {stepStatus === "failed" && (
            <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px]">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white animate-in zoom-in duration-300">
                <AlertCircle size={32} />
              </div>
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700">
            {currentStep?.icon}
            <span className="text-xs font-bold uppercase tracking-tight">{currentStep?.name}</span>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground">
            {currentStep?.instruction}
          </h3>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-0.5">
              <span>Time Remaining</span>
              <span className={countdown && countdown <= 2 ? "text-red-500 font-bold" : ""}>
                {countdown}s
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  stepStatus === "success" ? "bg-emerald-500" : stepStatus === "failed" ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
        <div className="flex items-center gap-2">
          {stepStatus === "success" && (
            <Button onClick={handleNextStep} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              Next Step
              <ArrowRight size={14} />
            </Button>
          )}
          {stepStatus === "failed" && (
            <Button onClick={handleRetry} size="sm" variant="destructive" className="gap-2">
              <RefreshCw size={14} />
              Retry Step
            </Button>
          )}
          {stepStatus !== "success" && stepStatus !== "failed" && (
            <Button onClick={onCancel} variant="ghost" size="sm" className="text-muted-foreground">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}