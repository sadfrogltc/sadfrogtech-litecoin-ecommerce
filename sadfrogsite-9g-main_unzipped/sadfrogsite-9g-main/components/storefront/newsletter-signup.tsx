"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Gift, Zap, Shield } from "lucide-react"
import { toast } from "sonner"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Welcome! You'll receive updates about new products and exclusive offers.");
        setEmail("");
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch (err) {
      toast.error("Network or server error.");
    }
    setIsLoading(false);
  }

  return (
    <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto bg-background/80 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Newsletter
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                Exclusive Offers
              </Badge>
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated with SadFrogTech
            </CardTitle>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get notified about new products, exclusive offers, and tech updates. 
              Join our community of tech enthusiasts!
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-8"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Subscribing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Subscribe
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Exclusive Offers</h3>
                <p className="text-sm text-muted-foreground">
                  Get early access to sales and special discounts
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">New Products</h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to know about latest tech releases
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  We respect your privacy and never spam
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="text-center mt-8 pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                🔒 Your email is secure. We'll never share it with third parties.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Unsubscribe anytime with one click.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
} 