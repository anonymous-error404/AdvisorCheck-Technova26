import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Users } from "lucide-react"
import Link from "next/link"

export function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary/5 rounded-full blur-[150px]" />

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Transparent
            </span>{" "}
            Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of investors who trust RA Hub to find verified trading advisors with proven track records.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/investor-signup">
              <Button size="lg" className="text-lg px-8 h-14">
                <Users className="mr-2 h-5 w-5" />
                Join as Investor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/advisor-signup">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-14 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                <Shield className="mr-2 h-5 w-5" />
                Register as Advisor
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Free to join
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              No hidden fees
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
