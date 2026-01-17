"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pendingAdvisors: 0, verifiedAdvisors: 0, totalTrades: 0, totalInvestors: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/auth/login")
          return
        }

        // Check if user is admin
        const { data: admin } = await supabase.from("admins").select("id").eq("user_id", session.user.id).single()

        if (!admin) {
          router.push("/dashboard")
          return
        }

        // Fetch stats
        const { count: pendingCount } = await supabase
          .from("advisors")
          .select("*", { count: "exact", head: true })
          .eq("verified", false)

        const { count: verifiedCount } = await supabase
          .from("advisors")
          .select("*", { count: "exact", head: true })
          .eq("verified", true)

        const { count: tradesCount } = await supabase.from("trades").select("*", { count: "exact", head: true })

        const { count: investorsCount } = await supabase.from("investors").select("*", { count: "exact", head: true })

        setStats({
          pendingAdvisors: pendingCount || 0,
          verifiedAdvisors: verifiedCount || 0,
          totalTrades: tradesCount || 0,
          totalInvestors: investorsCount || 0,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error:", error)
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">RA Hub Admin</h1>
          <button onClick={handleLogout} className="text-text-secondary hover:text-primary transition">
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-text-secondary text-sm mb-2">Pending Verification</div>
              <div className="text-4xl font-bold text-warning">{stats.pendingAdvisors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-text-secondary text-sm mb-2">Verified Advisors</div>
              <div className="text-4xl font-bold text-success">{stats.verifiedAdvisors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-text-secondary text-sm mb-2">Total Trades</div>
              <div className="text-4xl font-bold text-primary">{stats.totalTrades}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-text-secondary text-sm mb-2">Active Investors</div>
              <div className="text-4xl font-bold text-primary">{stats.totalInvestors}</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin/verify-advisors">
            <Card className="hover:border-primary transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-primary">Advisor Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  Review and verify pending SEBI advisor applications. {stats.pendingAdvisors} pending.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/audit-logs">
            <Card className="hover:border-primary transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-primary">Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  View immutable audit trail of all system events and admin actions.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
