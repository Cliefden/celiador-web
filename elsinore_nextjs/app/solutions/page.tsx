"use client";

import { useState } from "react";
import { FileText, CheckCircle, BarChart3, Shield, Users, Zap, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { LoginModal } from "@/components/LoginModal";

const Solutions = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  const features = [
    {
      icon: <FileText className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Invoice Submission & Management",
      description: "Secure upload, validation, and tracking of invoices with automated data extraction and verification."
    },
    {
      icon: <CheckCircle className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Streamlined Approval Workflows",
      description: "Customizable approval processes with multi-level authorization and automated notifications."
    },
    {
      icon: <BarChart3 className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Real-Time Status Tracking",
      description: "Live updates on invoice status, approval progress, and financing availability for all stakeholders."
    },
    {
      icon: <Users className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Secure Collaboration Tools", 
      description: "Encrypted communication channels for suppliers, clients, and financiers with document sharing."
    },
    {
      icon: <Zap className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Automated Payment Processing",
      description: "Fast, secure payment disbursement with multiple payment methods and international support."
    },
    {
      icon: <Globe className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Global Network Integration",
      description: "Connect with verified partners worldwide through our comprehensive business network."
    }
  ];

  const benefits = [
    {
      metric: "80%",
      title: "Faster Processing",
      description: "Reduce invoice approval times from days to hours"
    },
    {
      metric: "50%",
      title: "Cost Reduction", 
      description: "Lower administrative costs and operational overhead"
    },
    {
      metric: "99.9%",
      title: "Uptime Guarantee",
      description: "Enterprise-grade reliability and performance"
    },
    {
      metric: "24/7",
      title: "Support Available",
      description: "Round-the-clock customer support and monitoring"
    }
  ];

  const useCases = [
    {
      title: "For Suppliers",
      description: "Submit invoices securely, track approval status in real-time, and receive faster payments through our financing network.",
      features: ["Quick invoice upload", "Payment tracking", "Early payment options", "Global reach"]
    },
    {
      title: "For Clients", 
      description: "Streamline invoice approval processes, maintain supplier relationships, and optimize cash flow management.",
      features: ["Automated workflows", "Approval management", "Supplier portal", "Analytics dashboard"]
    },
    {
      title: "For Financiers",
      description: "Access verified invoice data, assess risk efficiently, and provide financing with complete transparency.",
      features: ["Risk assessment tools", "Due diligence support", "Portfolio management", "Compliance monitoring"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Complete Supply Chain <span className="gradient-text">Financing Platform</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Discover how Elsinore&apos;s comprehensive platform transforms every aspect of supply 
                chain financing, from invoice submission to final payment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="text-lg px-8 py-4" 
                  style={{ backgroundColor: 'hsl(210 45% 25%)', color: 'white' }}
                  onClick={() => setLoginModalOpen(true)}
                >
                  Book a Call
                </Button>
                <Link href="/contact">
                  <Button className="text-lg px-8 py-4 border border-gray-300 text-gray-700 hover:bg-gray-50">
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <img 
                src="/assets/platform-features.jpg" 
                alt="Platform features visualization" 
                className="w-full h-auto rounded-2xl shadow-medium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to streamline your supply chain financing operations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-elevated p-6 hover:scale-105 transition-transform duration-300 border border-gray-100">
                <CardContent className="pt-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Measurable Results
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See the impact Elsinore makes on your business operations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="card-elevated p-6 text-center border border-gray-100">
                <CardContent className="pt-4">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {benefit.metric}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
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

      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tailored solutions for suppliers, clients, and financiers
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="card-elevated p-8 border border-gray-100">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">
                    {useCase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {useCase.description}
                  </p>
                  <ul className="space-y-3">
                    {useCase.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-secondary mr-3 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10" style={{ color: 'hsl(180 35% 45%)' }} />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Enterprise-Grade Security
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Your data and transactions are protected by the same security standards used by 
            major financial institutions. We&apos;re SOC 2 Type II certified and fully compliant 
            with international data protection regulations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-background rounded-lg p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-2">Data Encryption</h3>
              <p className="text-muted-foreground text-sm">End-to-end encryption for all data transmission and storage</p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-2">Access Control</h3>
              <p className="text-muted-foreground text-sm">Multi-factor authentication and role-based permissions</p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-2">Compliance</h3>
              <p className="text-muted-foreground text-sm">GDPR, SOX, and PCI DSS compliant infrastructure</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join leading companies who trust Elsinore to power their supply chain financing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="text-lg px-8 py-4" 
              style={{ backgroundColor: 'hsl(210 45% 25%)', color: 'white' }}
              onClick={() => setLoginModalOpen(true)}
            >
              Book a Call
            </Button>
            <Link href="/contact">
              <Button className="text-lg px-8 py-4 border border-gray-300 text-gray-700 hover:bg-gray-50">
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      
      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        redirectTo="/protected"
      />
    </div>
  );
};

export default Solutions; 