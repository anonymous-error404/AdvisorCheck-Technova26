"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.email.trim() || !formData.password.trim()) {
        throw new Error("Email and password are required")
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      })

      if (authError) throw authError

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: advisor } = await supabase.from("advisors").select("id").eq("user_id", user.id).single()

        if (advisor) {
          router.push("/dashboard")
        } else {
          router.push("/marketplace")
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-lg p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">RA Hub</h1>
          <p className="text-text-secondary mb-6">Sign in to your account</p>

          {error && <div className="bg-danger/10 border border-danger text-danger p-4 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-background font-semibold py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-center">
            <p className="text-text-secondary">Don't have an account?</p>
            <div className="flex flex-col gap-2">
              <Link href="/auth/advisor-signup" className="text-primary hover:text-primary-dark">
                Register as Advisor
              </Link>
              <Link href="/auth/investor-signup" className="text-primary hover:text-primary-dark">
                Register as Investor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
