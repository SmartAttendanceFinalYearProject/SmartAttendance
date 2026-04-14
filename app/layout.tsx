import "./globals.css"
import localFont from "next/font/local"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Background } from "@/components/ui/background"

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
  title: "SMART Attendance | Facial Recognition System",
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
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-transparent backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center space-x-2 transition-all hover:opacity-80">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                SMART<span className="text-blue-400">Attendance</span>
              </span>
            </Link>
            
            <div className="flex items-center space-x-1">
              <div className="hidden sm:flex items-center space-x-1 mr-2">
                <Button variant="ghost" size="sm" className="font-semibold text-slate-300 hover:text-white hover:bg-white/5" asChild>
                  <Link href="/">Home</Link>
                </Button>
                <Button variant="ghost" size="sm" className="font-semibold text-slate-300 hover:text-white hover:bg-white/5" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
              <Button size="sm" className="font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-5" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        </nav>
        <main className="animate-fade-in-up relative z-10">
          {children}
        </main>
        
        <footer className="border-t border-white/5 py-8 bg-black/20 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-medium text-slate-400">
              © {new Date().getFullYear()} SMART Attendance System. Built with refined precision.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}

