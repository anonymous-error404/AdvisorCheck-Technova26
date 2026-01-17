"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface SubscriptionButtonProps {
  advisorId: string
  currentTierName?: string
  onSubscriptionChange?: () => void
}

export function SubscriptionButton({ advisorId, currentTierName, onSubscriptionChange }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const isSubscribed = !!currentTierName

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        // Redirect to login
        window.location.href = "/auth/login"
        return
      }

      const response = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId, tierName: "free" }),
      })

      if (response.ok) {
        onSubscriptionChange?.()
      }
    } catch (error) {
      console.error("Error subscribing:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/subscriptions/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId }),
      })

      if (response.ok) {
        onSubscriptionChange?.()
      }
    } catch (error) {
      console.error("Error unsubscribing:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <button
        onClick={handleUnsubscribe}
        disabled={loading}
        className="px-4 py-2 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Unsubscribing..." : "Unsubscribe"}
      </button>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition text-sm font-medium disabled:opacity-50"
    >
      {loading ? "Subscribing..." : "Subscribe"}
    </button>
  )
}
