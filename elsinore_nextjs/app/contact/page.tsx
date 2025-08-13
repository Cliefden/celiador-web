"use client";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    subject: "",
    message: ""
  });

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Email Us",
      details: "contact@elsinore.com",
      description: "Get in touch for general inquiries"
    },
    {
      icon: <Phone className="w-6 h-6" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Call Us",
      details: "+1 (555) 123-4567",
      description: "Speak with our sales team"
    },
    {
      icon: <MapPin className="w-6 h-6" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Visit Us",
      details: "123 Tech Street, Innovation City",
      description: "Our headquarters location"
    },
    {
      icon: <Clock className="w-6 h-6" style={{ color: 'hsl(180 35% 45%)' }} />,
      title: "Business Hours",
      details: "Mon-Fri: 9AM-6PM EST",
      description: "We&apos;re here to help during business hours"
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission here
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Ready to streamline your supply chain financing? We&apos;re here to help you get started 
            and answer any questions about our platform.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="card-elevated p-6 text-center border border-gray-100">
                <CardContent className="pt-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {info.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {info.title}
                  </h3>
                  <p className="text-primary font-medium mb-2">
                    {info.details}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {info.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="card-elevated border border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Your Role</Label>
                      <Select onValueChange={(value) => handleInputChange("role", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supplier">Supplier</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="financier">Financier</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select onValueChange={(value) => handleInputChange("subject", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="What can we help you with?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Schedule a Demo</SelectItem>
                        <SelectItem value="pricing">Pricing Information</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                        <SelectItem value="general">General Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your needs and how we can help..."
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" style={{ backgroundColor: 'hsl(210 45% 25%)', color: 'white' }}>
                    Send Message <Send className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <div className="space-y-8">
              <Card className="card-elevated p-8 border border-gray-100">
                <CardContent className="pt-4">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Sales Inquiries
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Interested in learning more about our platform? Our sales team is ready to 
                    show you how Elsinore can transform your supply chain financing operations.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Email:</strong> sales@elsinore.com
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Phone:</strong> +1 (555) 123-4567
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated p-8 border border-gray-100">
                <CardContent className="pt-4">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Technical Support
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Already using Elsinore? Our technical support team is available 24/7 to 
                    help you with any platform-related questions or issues.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Email:</strong> support@elsinore.com
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Portal:</strong> Available in your dashboard
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border border-gray-100">
                <CardContent className="pt-4">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Partnership Opportunities
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Interested in partnering with Elsinore? We&apos;re always looking for strategic 
                    partnerships that can benefit our mutual customers.
                  </p>
                  <Button className="border border-gray-300 text-gray-700 hover:bg-gray-50">
                    Learn About Partnerships
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact; 