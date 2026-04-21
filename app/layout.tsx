import "./globals.css"
import localFont from "next/font/local"
import Link from "next/link"
import { Background } from "@/components/ui/background"
import Navbar from "@/components/Navbar"

const archivGrotesk = localFont({
  src: [
    {
      path: "../public/fonts/ArchivGrotesk-Hairline.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/ArchivGrotesk-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/ArchivGrotesk-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/ArchivGrotesk-Normal.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/ArchivGrotesk-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/ArchivGrotesk-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-archiv",
})

export const metadata = {
  title: "SMART Attendance",
  description: "Next-generation facial recognition attendance system with liveness detection and real-time dashboard.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scrollbar-thin ${archivGrotesk.variable}`}>
      <body className={`${archivGrotesk.className} min-h-screen antialiased bg-background relative`}>
        <Background />
        <Navbar />
        <main className="animate-fade-in-up relative z-10">
          {children}
        </main>
        
        <footer className="border-t border-white/5 py-8 bg-black/20 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-medium text-slate-400">
              © {new Date().getFullYear()} SMART Attendance System.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}

