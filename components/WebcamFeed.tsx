"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { ImageDown } from "lucide-react"

export default function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageURL, setImageURL] = useState<string | null>(null)

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
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => console.error("Error accessing the camera:", err))
    }
  }, [])

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 border border-border">
      <video
        ref={videoRef}
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {imageURL && (
        <img
          src={imageURL}
          alt="Captured Frame"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <button
        onClick={capture}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 hover:bg-black/75 text-white text-xs font-medium py-1.5 px-3 rounded-md backdrop-blur-sm border border-white/10 transition-colors"
      >
        <ImageDown size={13} />
        Capture
      </button>
    </div>
  )
}