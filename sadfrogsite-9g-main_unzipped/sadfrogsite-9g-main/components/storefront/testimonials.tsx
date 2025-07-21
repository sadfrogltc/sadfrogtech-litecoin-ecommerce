"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote, User, Shield, Zap, Truck } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Mr. Awesome",
    role: "Litecoin Enthusiast",
    avatar: "👨‍💻",
    rating: 5,
    content: "Amazing quality product from the legend Sad Frog himself!",
    category: "Tech Gadgets"
  },
  {
    id: 2,
    name: "Anonymous",
    role: "Litecoin Enthusiast",
    avatar: "👩‍🎨",
    rating: 5,
    content: "Very cool stuff! Thank you! 🐸",
    category: "Desktop Trinkets"
  },
  {
    id: 3,
    name: "Anonymous",
    role: "Crypto Investor",
    avatar: "👨‍💼",
    rating: 5,
    content: "Finally, a store that accepts Litecoin! Fast shipping and great customer service. Highly recommended!",
    category: "Overall Experience"
  }
]

export function Testimonials() {
  return (
    <section className="py-16 bg-gradient-to-br from-muted/50 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Quote className="h-3 w-3 mr-1" />
            Customer Reviews
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who love our products and seamless Litecoin payment experience.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div>
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {testimonial.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-sm text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-muted-foreground">
                All transactions are secured with Litecoin blockchain technology
              </p>
            </div>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Fast Shipping</h3>
              <p className="text-muted-foreground">
                Worldwide delivery with tracking and insurance included
              </p>
            </div>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">
                Round-the-clock customer support for all your needs
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
} 