//
//  SolutionsView.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-01-30.
//

import SwiftUI

struct SolutionsView: View {
    @State private var showingLoginModal = false
    
    let features = [
        FeatureCard(
            icon: "brain",
            title: "AI Code Generation",
            description: "Generate production-ready code with advanced AI models that understand your requirements perfectly."
        ),
        FeatureCard(
            icon: "checkmark.circle",
            title: "Smart Testing",
            description: "Automatically generate comprehensive test suites that catch bugs before they reach production."
        ),
        FeatureCard(
            icon: "chart.bar",
            title: "Real-Time Collaboration",
            description: "Work together with your team in real-time, sharing projects and reviewing code seamlessly."
        ),
        FeatureCard(
            icon: "person.3",
            title: "Magic Templates",
            description: "Start with stunning SaaS starters, AI chat apps, e-commerce stores, and more. Launch in minutes."
        ),
        FeatureCard(
            icon: "bolt",
            title: "One-Click Deployment",
            description: "Deploy your applications instantly with support for Vercel, Netlify, and custom servers."
        ),
        FeatureCard(
            icon: "globe",
            title: "Advanced Analytics",
            description: "Track your development progress, code quality metrics, and deployment performance in real-time."
        )
    ]
    
    let benefits = [
        BenefitMetric(metric: "80%", title: "Faster Development", description: "Reduce development time from weeks to days"),
        BenefitMetric(metric: "90%", title: "Less Bugs", description: "AI-generated tests catch issues before deployment"),
        BenefitMetric(metric: "99.9%", title: "Uptime Guarantee", description: "Enterprise-grade reliability and performance"),
        BenefitMetric(metric: "24/7", title: "Support Available", description: "Round-the-clock developer support and AI assistance")
    ]
    
    let useCases = [
        UseCase(
            title: "For Solo Developers",
            description: "Build full-stack applications quickly with AI assistance, from idea to deployment in record time.",
            features: ["AI code generation", "Smart templates", "One-click deploy", "Automated testing"]
        ),
        UseCase(
            title: "For Development Teams",
            description: "Collaborate seamlessly with real-time editing, code reviews, and shared project management.",
            features: ["Real-time collaboration", "Code review tools", "Team analytics", "Version control"]
        ),
        UseCase(
            title: "For Enterprises",
            description: "Scale development operations with enterprise-grade security, compliance, and advanced analytics.",
            features: ["Enterprise security", "Custom templates", "Advanced analytics", "Priority support"]
        )
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Section
                heroSection
                
                // Key Features
                featuresSection
                
                // Benefits Section
                benefitsSection
                
                // Use Cases
                useCasesSection
                
                // Security Section
                securitySection
                
                // CTA Section
                ctaSection
            }
        }
        .background(Color(.systemBackground))
        .navigationTitle("Solutions")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showingLoginModal) {
            LoginModalView()
        }
    }
    
    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: 32) {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Complete AI Development")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.primary)
                    
                    Text("Platform")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.blue)
                }
                
                Text("Discover how Bether's comprehensive platform transforms every aspect of software development, from idea to deployment.")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .lineLimit(nil)
                    .multilineTextAlignment(.leading)
                
                HStack(spacing: 16) {
                    Button("Book a Call") {
                        showingLoginModal = true
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    
                    Button("Schedule Demo") {
                        // Handle demo action
                    }
                    .buttonStyle(SecondaryButtonStyle())
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            
            // Platform features image
            Image("platform-features")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 300)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
                .padding(.horizontal, 20)
        }
        .padding(.bottom, 60)
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.05), Color.green.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
    
    // MARK: - Features Section
    private var featuresSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("Platform Features")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Everything you need to build, test, and deploy amazing applications")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                ForEach(features, id: \.title) { feature in
                    feature
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
    
    // MARK: - Benefits Section
    private var benefitsSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("Measurable Results")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("See the impact Bether makes on your development workflow")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                ForEach(benefits, id: \.title) { benefit in
                    benefit
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
        .background(Color(.systemGray6))
    }
    
    // MARK: - Use Cases Section
    private var useCasesSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("Built for Every Role")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Tailored solutions for solo developers, teams, and enterprises")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible())
            ], spacing: 20) {
                ForEach(useCases, id: \.title) { useCase in
                    useCase
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
    
    // MARK: - Security Section
    private var securitySection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 24) {
                Circle()
                    .fill(Color.blue.opacity(0.1))
                    .frame(width: 80, height: 80)
                    .overlay(
                        Image(systemName: "shield")
                            .font(.system(size: 40))
                            .foregroundColor(.blue)
                    )
                
                Text("Enterprise-Grade Security")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Your code and data are protected by the same security standards used by major tech companies. We're SOC 2 Type II certified and fully compliant with international data protection regulations.")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                SecurityFeature(title: "Data Encryption", description: "End-to-end encryption for all data transmission and storage")
                SecurityFeature(title: "Access Control", description: "Multi-factor authentication and role-based permissions")
                SecurityFeature(title: "Compliance", description: "GDPR, SOX, and PCI DSS compliant infrastructure")
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
            
            Text("Join leading developers who trust Bether to power their application development.")
                .font(.title3)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            HStack(spacing: 16) {
                Button("Book a Call") {
                    showingLoginModal = true
                }
                .buttonStyle(PrimaryButtonStyle())
                
                NavigationLink("Contact Us") {
                    ContactView()
                }
                .buttonStyle(SecondaryButtonStyle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
}

// MARK: - Supporting Views
struct FeatureCard: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 48, height: 48)
                .overlay(
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(.blue)
                )
            
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

struct BenefitMetric: View {
    let metric: String
    let title: String
    let description: String
    
    var body: some View {
        VStack(spacing: 12) {
            Text(metric)
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.blue)
            
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

struct UseCase: View {
    let title: String
    let description: String
    let features: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.blue)
            
            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 12) {
                ForEach(features, id: \.self) { feature in
                    HStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.title3)
                        
                        Text(feature)
                            .font(.body)
                            .foregroundColor(.primary)
                    }
                }
            }
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

struct SecurityFeature: View {
    let title: String
    let description: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

#Preview {
    SolutionsView()
} 