"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { getTierPrice } from "@/lib/subscription-tiers"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Subscription {
  id: string
  advisor_id: string
  tier_name: string
  status: string
  created_at: string
  advisor: {
    id: string
    full_name: string
    company_name: string
    sebi_number: string
  }
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/auth/login")
          return
        }

        // Get investor
        const { data: investor } = await supabase.from("investors").select("id").eq("user_id", session.user.id).single()

        if (!investor) {
          router.push("/marketplace")
          return
        }

        // Get subscriptions with advisor details
        const { data } = await supabase
          .from("investor_subscriptions")
          .select(
            `
            id,
            advisor_id,
            tier_name,
            status,
            created_at,
            advisors:advisor_id (
              id,
              full_name,
              company_name,
              sebi_number
            )
          `,
          )
          .eq("investor_id", investor.id)
          .order("created_at", { ascending: false })

        setSubscriptions(data as any)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching subscriptions:", error)
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [router])

  const handleUnsubscribe = async (advisorId: string) => {
    try {
      const response = await fetch("/api/subscriptions/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId }),
      })

      if (response.ok) {
        setSubscriptions(subscriptions.filter((s) => s.advisor_id !== advisorId))
      }
    } catch (error) {
      console.error("Error unsubscribing:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading subscriptions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">My Subscriptions</h1>
          <Link href="/marketplace" className="text-primary hover:text-primary-dark">
            Back to Marketplace
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {subscriptions.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <p className="text-text-secondary mb-4">You haven't subscribed to any advisors yet</p>
            <Link
              href="/marketplace"
              className="inline-block px-6 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark"
            >
              Browse Advisors
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-surface border border-border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary mb-1">{sub.advisor.full_name}</h3>
                    <p className="text-text-secondary text-sm mb-2">{sub.advisor.company_name}</p>
                    <p className="text-xs text-text-secondary mb-4">SEBI: {sub.advisor.sebi_number}</p>

                    <div className="flex gap-4">
                      <div>
                        <span className="text-text-secondary text-sm">Tier: </span>
                        <span className="font-semibold capitalize text-primary">{sub.tier_name}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary text-sm">Price: </span>
                        <span className="font-semibold">₹{getTierPrice(sub.tier_name)}/month</span>
                      </div>
                      <div>
                        <span className="text-text-secondary text-sm">Status: </span>
                        <span className="font-semibold text-success capitalize">{sub.status}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary text-sm">Subscribed: </span>
                        <span className="font-semibold">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/advisor/${sub.advisor_id}`}
                      className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition text-sm font-medium"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleUnsubscribe(sub.advisor_id)}
                      className="px-4 py-2 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition text-sm font-medium"
                    >
                      Unsubscribe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
