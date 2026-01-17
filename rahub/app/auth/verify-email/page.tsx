"use client"

import Link from "next/link"

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-lg p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">RA Hub</h1>
          <p className="text-text-secondary mb-6">Verify your email</p>

          <div className="bg-success/10 border border-success text-success p-4 rounded-lg mb-6">
            <p className="font-semibold mb-2">Account created successfully! 🎉</p>
            <p className="text-sm">Check your email for a verification link to complete your registration.</p>
          </div>

          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Didn't receive an email? Check your spam folder or wait a few moments.
            </p>

            <p className="text-center text-text-secondary text-sm">
              Already verified?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary-dark font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
