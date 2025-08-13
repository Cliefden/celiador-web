import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/elsinore_logo.png" 
                alt="Elsinore Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">elsinore</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Streamline your supply chain financing with Elsinore&apos;s secure and powerful platform. 
              Connect suppliers, clients, and financiers with seamless invoice management and approvals.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail size={16} />
                <span>contact@elsinore.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin size={16} />
                <span>123 Tech Street, Innovation City</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/solutions" className="block text-muted-foreground hover:text-primary transition-colors">
                Solutions
              </Link>
              <Link href="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <div className="space-y-2">
              <Link href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © 2024 Elsinore. All rights reserved. Powering supply chain financing worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 