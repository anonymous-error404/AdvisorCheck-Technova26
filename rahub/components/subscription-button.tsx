"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { TierSelectionModal } from "./tier-selection-modal"
import { useToast } from "@/hooks/use-toast"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface SubscriptionButtonProps {
  advisorId: string
  advisorName?: string
  currentTierName?: string
  onSubscriptionChange?: () => void
}

export function SubscriptionButton({ advisorId, advisorName = "this advisor", currentTierName, onSubscriptionChange }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showTierModal, setShowTierModal] = useState(false)
  const { toast } = useToast()
  const isSubscribed = !!currentTierName

  const handleSelectTier = async (tierName: string) => {
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
        body: JSON.stringify({ advisorId, tierName }),
      })

      if (response.ok) {
        toast({
          title: "Subscribed Successfully!",
          description: `You are now subscribed to the ${tierName} tier.`,
        })
        onSubscriptionChange?.()
      } else {
        const data = await response.json()
        toast({
          title: "Subscription Failed",
          description: data.error || "Failed to subscribe. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error subscribing:", error)
      toast({
        title: "Error",
        description: "An error occurred while subscribing.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowTierModal(false)
    }
  }

  const handleOpenTierModal = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = "/auth/login"
      return
    }
    setShowTierModal(true)
  }

  const handleUnsubscribe = async () => {
    if (!confirm("Are you sure you want to unsubscribe?")) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch("/api/subscriptions/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advisorId }),
      })

      if (response.ok) {
        toast({
          title: "Unsubscribed",
          description: "You have successfully unsubscribed.",
        })
        onSubscriptionChange?.()
      } else {
        const data = await response.json()
        toast({
          title: "Unsubscribe Failed",
          description: data.error || "Failed to unsubscribe. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error unsubscribing:", error)
      toast({
        title: "Error",
        description: "An error occurred while unsubscribing.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <div className="flex flex-col gap-2">
        <div className="px-4 py-2 bg-success/20 text-success rounded-lg text-sm font-medium text-center">
          ✓ Subscribed ({currentTierName})
        </div>
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="px-4 py-2 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Unsubscribing..." : "Unsubscribe"}
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleOpenTierModal}
        disabled={loading}
        className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Loading..." : "Subscribe"}
      </button>
      {showTierModal && (
        <TierSelectionModal
          advisorId={advisorId}
          advisorName={advisorName}
          onSelectTier={handleSelectTier}
          onClose={() => setShowTierModal(false)}
        />
      )}
    </>
  )
}
