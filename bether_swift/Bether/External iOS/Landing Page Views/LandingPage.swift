//
//  LandingPage.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-07-30.
//

import SwiftUI

struct LandingPage: View {
    @State private var showingLoginModal = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Section
                heroSection
                
                // Benefits Section
                benefitsSection
                
                // How It Works Section
                howItWorksSection
                
                // Testimonials Section
                testimonialsSection
                
                // CTA Section
                ctaSection
            }
        }
        .background(Color(.systemBackground))
        .sheet(isPresented: $showingLoginModal) {
            LoginModalView()
        }
    }
    
    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: 32) {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Build Better Apps")
                        .font(.system(size: 36, weight: .bold, design: .default))
                        .foregroundColor(.primary)
                    
                    Text("with AI")
                        .font(.system(size: 36, weight: .bold, design: .default))
                        .foregroundColor(.blue)
                }
                
                Text("Generate, test, and deploy applications faster than ever before. Our AI-powered platform helps developers create better code, reduce bugs, and ship faster.")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .lineLimit(nil)
                    .multilineTextAlignment(.leading)
                
                HStack(spacing: 16) {
                    Button("Get Started") {
                        // Handle get started action
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    
                    Button("Sign In") {
                        showingLoginModal = true
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    
                    NavigationLink("Learn More") {
                        SolutionsView()
                    }
                    .buttonStyle(TextButtonStyle())
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            
            // Hero image
            Image("team-illustration")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(height: 300)
                .clipped()
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
                .padding(.horizontal, 20)
        }
        .padding(.bottom, 60)
        .background(
            ZStack {
                Image("hero-bg")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .opacity(0.2)
                
                LinearGradient(
                    colors: [Color.blue.opacity(0.05), Color.green.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        )
    }
    
    // MARK: - Benefits Section
    private var benefitsSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("Why Choose Celiador?")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Built for modern developers who demand speed, quality, and innovation")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Platform features image
            Image("platform-features")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 200)
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                BenefitCard(
                    icon: "bolt.fill",
                    title: "Lightning Fast",
                    description: "Generate production-ready code in minutes, not hours"
                )
                
                BenefitCard(
                    icon: "brain",
                    title: "AI-Powered",
                    description: "Advanced AI models that understand your requirements"
                )
                
                BenefitCard(
                    icon: "globe",
                    title: "Global Templates",
                    description: "Access stunning templates for any type of application"
                )
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
        .background(Color(.systemGray6))
    }
    
    // MARK: - How It Works Section
    private var howItWorksSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("How It Works")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Three simple steps to transform your development workflow")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                StepCard(
                    number: "01",
                    title: "Describe Your App",
                    description: "Tell our AI what you want to build using natural language"
                )
                
                StepCard(
                    number: "02",
                    title: "AI Generates Code",
                    description: "Watch as our AI creates production-ready code with tests"
                )
                
                StepCard(
                    number: "03",
                    title: "One-Click Deploy",
                    description: "Deploy your application instantly to Vercel or other platforms"
                )
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
    
    // MARK: - Testimonials Section
    private var testimonialsSection: some View {
        VStack(spacing: 40) {
            Text("Trusted by Industry Leaders")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                TestimonialCard(
                    company: "StartupLab",
                    quote: "Celiador reduced our development time by 80%. We ship features faster than ever before.",
                    author: "Sarah Chen, CTO"
                )
                
                TestimonialCard(
                    company: "DevCorp Solutions",
                    quote: "The AI code generation is incredible. It understands exactly what we need.",
                    author: "Michael Torres, Lead Developer"
                )
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
        .background(Color(.systemGray6))
    }
    
    // MARK: - CTA Section
    private var ctaSection: some View {
        VStack(spacing: 24) {
            Text("Ready to Transform Your Development?")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.primary)
                .multilineTextAlignment(.center)
            
            Text("Join thousands of developers already using Celiador to build amazing applications faster.")
                .font(.title3)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            HStack(spacing: 16) {
                Button("Get Started Free") {
                    // Handle get started action
                }
                .buttonStyle(PrimaryButtonStyle())
                
                NavigationLink("Watch Demo") {
                    SolutionsView()
                }
                .buttonStyle(SecondaryButtonStyle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
}

// MARK: - Supporting Views
struct BenefitCard: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(.blue)
                )
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

struct StepCard: View {
    let number: String
    let title: String
    let description: String
    
    var body: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [.blue, .green],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 64, height: 64)
                .overlay(
                    Text(number)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                )
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(20)
    }
}

struct TestimonialCard: View {
    let company: String
    let quote: String
    let author: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                Text(company)
                    .font(.headline)
                    .foregroundColor(.primary)
            }
            
            Text("\"\(quote)\"")
                .font(.body)
                .foregroundColor(.secondary)
                .italic()
            
            Text("— \(author)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}


// MARK: - Login Modal
struct LoginModalView: View {
    var body: some View {
        NewLoginView()
    }
}

#Preview {
    LandingPage()
}
