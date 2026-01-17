"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { AdvisorVerificationCard } from "@/components/advisor-verification-card"
import { Card, CardContent } from "@/components/ui/card"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function VerifyAdvisors() {
  const router = useRouter()
  const [advisors, setAdvisors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPendingAdvisors = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/auth/login")
          return
        }

        // Check if admin
        const { data: admin } = await supabase.from("admins").select("id").eq("user_id", session.user.id).single()

        if (!admin) {
          router.push("/dashboard")
          return
        }

        const response = await fetch("/api/admin/pending-advisors")
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          setError(body?.error || "Failed to fetch pending advisors")
          setLoading(false)
          return
        }

        const body = await response.json()
        setAdvisors(body?.advisors || [])
        setLoading(false)
      } catch (error) {
        console.error("Error:", error)
        setError("Failed to fetch pending advisors")
        setLoading(false)
      }
    }

    fetchPendingAdvisors()
  }, [router])

  const handleVerified = () => {
    // Refresh the list
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-primary hover:text-primary-dark">
              ← Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-primary mt-2">Verify Advisors</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-text-secondary">{error}</p>
            </CardContent>
          </Card>
        ) : advisors.length === 0 ? (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-text-secondary">No pending advisor applications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {advisors.map((advisor) => (
              <AdvisorVerificationCard key={advisor.id} advisor={advisor} onVerified={handleVerified} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
