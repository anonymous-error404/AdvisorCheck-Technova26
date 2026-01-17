"use client"

import { useState } from "react"
import { DEFAULT_TIERS } from "@/lib/subscription-tiers"

interface TierSelectionModalProps {
  advisorId: string
  advisorName: string
  onSelectTier: (tierName: string) => void
  onClose: () => void
}

export function TierSelectionModal({ advisorId, advisorName, onSelectTier, onClose }: TierSelectionModalProps) {
  const [selectedTier, setSelectedTier] = useState("free")

  const handleSubscribe = () => {
    onSelectTier(selectedTier)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="bg-surface border-b border-border p-6 flex justify-between items-center sticky top-0">
          <div>
            <h2 className="text-2xl font-bold">Subscribe to {advisorName}</h2>
            <p className="text-text-secondary text-sm mt-1">Choose a subscription tier</p>
          </div>
          <button onClick={onClose} className="text-2xl text-text-secondary hover:text-primary">
            ✕
          </button>
        </div>

        {/* Tiers */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {DEFAULT_TIERS.map((tier) => (
              <div
                key={tier.name}
                onClick={() => setSelectedTier(tier.name)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                  selectedTier === tier.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <h3 className="text-2xl font-bold text-primary mb-2 capitalize">{tier.name}</h3>
                <p className="text-3xl font-bold mb-2">
                  ₹{tier.price}
                  {tier.price === 0 ? "" : "/month"}
                </p>
                <p className="text-text-secondary text-sm mb-4">
                  {tier.price === 0 ? "Forever Free" : tier.price === 99 ? "Popular" : "Most Features"}
                </p>

                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Subscribe Button */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSubscribe}
              className="flex-1 bg-primary text-background font-semibold py-3 rounded-lg hover:bg-primary-dark transition"
            >
              Subscribe to {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-surface border border-border rounded-lg hover:border-primary transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
