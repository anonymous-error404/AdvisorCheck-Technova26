"use client"

import { Suspense } from "react"
import CompareContent from "./compare-content"

export default function CompareAdvisors() {
  return (
    <Suspense fallback={null}>
      <CompareContent />
    </Suspense>
  )
}
