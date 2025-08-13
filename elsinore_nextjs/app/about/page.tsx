"use client";
import { Target, Users, Award, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: <Target className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Innovation",
      description: "We continuously evolve our platform to meet the changing needs of supply chain financing."
    },
    {
      icon: <Users className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Trust",
      description: "Building lasting relationships through transparency, security, and reliable service."
    },
    {
      icon: <Award className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Excellence",
      description: "Delivering exceptional results and exceeding expectations in everything we do."
    },
    {
      icon: <Globe className="w-8 h-8" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Global Impact",
      description: "Connecting businesses worldwide to create a more efficient global supply chain."
    }
  ];

  const stats = [
    { number: "1000+", label: "Active Companies" },
    { number: "$500M+", label: "Processed Financing" },
    { number: "50+", label: "Countries Served" },
    { number: "99.9%", label: "Platform Uptime" }
  ];

  const differences = [
    {
      title: "Real-Time Transparency",
      description: "Every stakeholder has complete visibility into the financing process, from invoice submission to final payment."
    },
    {
      title: "Advanced Security",
      description: "Bank-grade encryption and multi-layer security protocols protect your sensitive financial data."
    },
    {
      title: "Smart Automation",
      description: "AI-powered workflows reduce manual processes and accelerate approval times by up to 80%."
    },
    {
      title: "Global Connectivity",
      description: "Connect with partners worldwide through our comprehensive network of suppliers, clients, and financiers."
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
                Transforming Supply Chain Finance
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Elsinore was founded with a simple mission: to make supply chain financing accessible, 
                transparent, and efficient for businesses of all sizes. We&apos;re building the future of 
                B2B financial collaboration.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img 
                src="/assets/team-illustration.jpg" 
                alt="Elsinore team collaboration" 
                className="w-full h-auto rounded-2xl shadow-medium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">
            Our Mission
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-12">
            To revolutionize supply chain financing by creating a secure, transparent, and efficient 
            platform that connects suppliers, clients, and financiers globally. We believe that 
            every business deserves access to fast, fair, and reliable financing solutions.
          </p>
          <Card className="card-elevated p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border border-gray-100">
            <CardContent className="pt-4">
              <blockquote className="text-2xl font-medium text-foreground italic">
                &ldquo;We&apos;re not just building software – we&apos;re building bridges between businesses, 
                creating opportunities, and driving global economic growth.&rdquo;
              </blockquote>
              <cite className="block mt-4 text-muted-foreground">
                — Elsinore Leadership Team
              </cite>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="card-elevated p-6 text-center border border-gray-100">
                <CardContent className="pt-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              What Makes Elsinore Different
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              In a crowded fintech landscape, we stand out through innovation and commitment to our users
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {differences.map((diff, index) => (
              <Card key={index} className="card-elevated p-8 border border-gray-100">
                <CardContent className="pt-4">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {diff.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {diff.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">
            Leadership Team
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Our leadership team combines decades of experience in fintech, supply chain management, 
            and enterprise software to deliver exceptional solutions for our clients.
          </p>
          <Card className="card-elevated p-8 border border-gray-100">
            <CardContent className="pt-4">
              <p className="text-lg text-muted-foreground">
                With backgrounds spanning Goldman Sachs, McKinsey & Company, SAP, and successful 
                fintech startups, our team brings both deep industry knowledge and innovative 
                thinking to every challenge.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About; 