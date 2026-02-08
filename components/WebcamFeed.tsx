 "use client"

 import { useRef, useEffect, useState, useCallback } from "react"

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
  const ctx = canvas.getContext('2d')
  if (ctx) {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const url = canvas.toDataURL('image/png')
  setImageURL(url)
  sendImageToDatabase(url)
  }
  }
  }, [])

  const sendImageToDatabase = async (image: string) => {
  try {
  const response = await fetch('http://localhost:8000/attendance/', {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  },
  body: JSON.stringify({ image }),
  })

  if (response.ok) {
  console.log('Image uploaded successfully')
  } else {
  console.error('Image upload failed')
  }
  } catch (error) {
  console.error('Error uploading image:', error)
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
  <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
  <video ref={videoRef} autoPlay className="absolute inset-0 w-full h-full object-cover" />
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
  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
  >
  Capture
  </button>
  </div>
  )
 }