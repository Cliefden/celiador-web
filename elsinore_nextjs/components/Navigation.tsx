"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/LoginModal";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <>
      <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/elsinore_logo.png" 
                alt="Elsinore Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">elsinore</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`text-sm font-medium transition-colors hover:text-secondary ${
                    isActive(item.path) ? "text-secondary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Button 
                className="btn-primary"
                onClick={() => setLoginModalOpen(true)}
              >
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                     className={`block px-3 py-2 text-base font-medium transition-colors ${
                       isActive(item.path)
                         ? "text-secondary bg-secondary/5"
                         : "text-muted-foreground hover:text-secondary hover:bg-secondary/5"
                     }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="px-3 py-2">
                  <Button 
                    className="btn-primary w-full"
                    onClick={() => {
                      setIsOpen(false);
                      setLoginModalOpen(true);
                    }}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        redirectTo="/protected"
      />
    </>
  );
};

export default Navigation; 