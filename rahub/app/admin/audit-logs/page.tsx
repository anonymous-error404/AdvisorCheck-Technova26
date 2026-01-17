"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AuditLogs() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState("")

  useEffect(() => {
    const fetchLogs = async () => {
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

        // Fetch audit logs
        let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)

        if (actionFilter) {
          query = query.eq("action", actionFilter)
        }

        const { data } = await query

        setLogs(data || [])
        setLoading(false)
      } catch (error) {
        console.error("Error:", error)
        setLoading(false)
      }
    }

    fetchLogs()
  }, [router, actionFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading audit logs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/admin" className="text-primary hover:text-primary-dark">
            ← Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-primary mt-2">Audit Logs</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="mb-6">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="">All Actions</option>
            <option value="ADVISOR_VERIFIED">Advisor Verified</option>
            <option value="ADVISOR_REJECTED">Advisor Rejected</option>
            <option value="TRADE_PUBLISHED">Trade Published</option>
            <option value="TRADE_CLOSED">Trade Closed</option>
          </select>
        </div>

        {/* Logs */}
        <div className="space-y-4">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="pt-8 text-center">
                <p className="text-text-secondary">No audit logs found</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-primary">{log.action}</p>
                      <p className="text-sm text-text-secondary">
                        {log.entity_type}: {log.entity_id}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  {log.reason && <p className="text-sm text-text-secondary">Reason: {log.reason}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
