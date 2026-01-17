"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdvisorVerificationCardProps {
  advisor: any
  onVerified: () => void
}

export function AdvisorVerificationCard({ advisor, onVerified }: AdvisorVerificationCardProps) {
  const [verificationNotes, setVerificationNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/verify-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisorId: advisor.id,
          notes: verificationNotes,
        }),
      })

      if (response.ok) {
        onVerified()
      }
    } catch (error) {
      console.error("Error verifying advisor:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/reject-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisorId: advisor.id,
          reason: verificationNotes,
        }),
      })

      if (response.ok) {
        onVerified()
      }
    } catch (error) {
      console.error("Error rejecting advisor:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{advisor.full_name}</CardTitle>
            <p className="text-sm text-text-secondary">{advisor.company_name}</p>
          </div>
          <Badge className="bg-warning/20 text-warning">Pending Review</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">SEBI Number</p>
              <p className="font-semibold">{advisor.sebi_number}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Experience</p>
              <p className="font-semibold">{advisor.years_experience} years</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Email</p>
              <p className="font-semibold">{advisor.email}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Applied</p>
              <p className="font-semibold">{new Date(advisor.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Verification Notes</label>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add notes for this verification..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 bg-success text-background font-semibold py-2 rounded-lg hover:bg-success-dark transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 bg-danger text-background font-semibold py-2 rounded-lg hover:bg-danger-dark transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
