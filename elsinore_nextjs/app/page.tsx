"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { LoginModal } from "@/components/LoginModal";

const Index = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const benefits = [
    {
      icon: <Zap className="w-6 h-6" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Lightning Fast",
      description: "Process invoices and approvals in minutes, not days"
    },
    {
      icon: <Shield className="w-6 h-6" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Bank-Grade Security",
      description: "Enterprise-level encryption and compliance standards"
    },
    {
      icon: <Globe className="w-6 h-6" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Global Reach",
      description: "Connect with suppliers and financiers worldwide"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Invoices",
      description: "Suppliers submit invoices through our secure platform"
    },
    {
      number: "02", 
      title: "Quick Approval",
      description: "Clients review and approve invoices with streamlined workflows"
    },
    {
      number: "03",
      title: "Fast Financing",
      description: "Financiers provide immediate funding with complete transparency"
    }
  ];

  const testimonials = [
    {
      company: "TechFlow Solutions",
      quote: "Elsinore reduced our invoice processing time by 80%. Game-changer for our supply chain.",
      author: "Sarah Chen, CFO"
    },
    {
      company: "Global Manufacturing Inc",
      quote: "The security and transparency give us complete confidence in our financing operations.",
      author: "Michael Torres, Finance Director"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(/assets/hero-bg.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Your Supply Chain Financing,{" "}
                <span className="gradient-text">Simplified</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Streamline your supply chain financing with Elsinore&apos;s secure and powerful platform. 
                Connect suppliers, clients, and financiers with seamless invoice management and approvals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/sign-up">
                  <Button className="btn-primary text-lg px-8 py-4">
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  className="btn-outline text-lg px-8 py-4"
                  onClick={() => setLoginModalOpen(true)}
                >
                  Sign In
                </Button>
                <Link href="/solutions">
                  <Button variant="ghost" className="text-lg px-8 py-4 text-muted-foreground hover:text-foreground">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="animate-slide-up">
              <Image 
                src="/assets/team-illustration.jpg" 
                alt="Team collaboration" 
                className="w-full h-auto rounded-2xl shadow-medium"
                width={600}
                height={400}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Choose Elsinore?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for modern businesses that demand efficiency, security, and transparency
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="card-elevated p-6 text-center hover:scale-105 transition-transform duration-300 border border-gray-100">
                <CardContent className="pt-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'hsl(180 35% 45% / 0.1)' }}
                  >
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your supply chain financing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(180 35% 45%) 0%, hsl(210 45% 25%) 100%)'
                  }}
                >
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by Industry Leaders
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-elevated p-8 border border-gray-100">
                <CardContent className="pt-4">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-5 h-5 text-secondary mr-2" />
                    <span className="font-semibold text-foreground">{testimonial.company}</span>
                  </div>
                  <blockquote className="text-lg text-muted-foreground mb-4 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <cite className="text-sm text-muted-foreground font-medium">
                    — {testimonial.author}
                  </cite>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses already using Elsinore to streamline their financing operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button className="text-lg px-8 py-4" style={{ backgroundColor: 'hsl(210 45% 25%)', color: 'white' }}>
                Book a Call <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="text-lg px-8 py-4 border border-gray-300 text-gray-700 hover:bg-gray-50">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Separator line */}
      <div className="border-t border-gray-50"></div>

      <Footer />

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        redirectTo="/protected"
      />
    </div>
  );
};

export default Index;
