"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { ImageDown } from "lucide-react"

export default function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageURL, setImageURL] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const startCamera = useCallback(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setCameraError(null)
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            setCameraError("Camera permission denied. Please allow camera access in your browser settings.")
          } else {
            setCameraError("Error accessing the camera. Please make sure it is connected and not in use by another application.")
          }
          console.error("Error accessing the camera:", err)
        })
    } else {
      setCameraError("Your browser does not support camera access.")
    }
  }, [])

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const url = canvas.toDataURL("image/png")
        setImageURL(url)
        sendImageToDatabase(url)
      }
    }
  }, [])

  const sendImageToDatabase = async (image: string) => {
    try {
      const response = await fetch("http://localhost:8000/attendance/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      })

      if (response.ok) {
        console.log("Image uploaded successfully")
      } else {
        console.error("Image upload failed")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    }
  }

  useEffect(() => {
    startCamera()
  }, [startCamera])

  const handleRetry = () => {
    setCameraError(null)
    startCamera()
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        {cameraError ? (
          <div className="flex flex-col items-center justify-center w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-red-500 text-center">{cameraError}</p>
            <button onClick={handleRetry} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md">
              Retry
            </button>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <button
        onClick={capture}
        disabled={!!cameraError}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        Capture
      </button>
      {imageURL && (
        <div className="mt-4 p-2 border rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Captured Image:</h3>
          <ImageDown className="w-4 h-4" />
          <img src={imageURL} alt="Captured" className="max-w-xs rounded-lg" />
        </div>
      )}
    </div>
  )
}