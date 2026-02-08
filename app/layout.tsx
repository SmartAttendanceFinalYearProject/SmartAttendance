import "./globals.css"
import { Inter } from "next/font/google"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Facial Recognition Attendance System",
  description: "A simple facial recognition attendance system UI with dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              FR Attendance
            </Link>
            <div className="space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/">Home</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-100 py-8">{children}</main>
      </body>
    </html>
  )
}

