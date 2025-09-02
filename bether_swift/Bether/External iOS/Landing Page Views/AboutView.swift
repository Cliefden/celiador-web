//
//  AboutView.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-01-30.
//

import SwiftUI

struct AboutView: View {
    let values = [
        ValueCard(
            icon: "target",
            title: "Innovation",
            description: "We continuously evolve our AI platform to meet the changing needs of modern developers."
        ),
        ValueCard(
            icon: "person.3",
            title: "Collaboration",
            description: "Building tools that help development teams work together seamlessly and efficiently."
        ),
        ValueCard(
            icon: "star",
            title: "Excellence",
            description: "Delivering exceptional AI-powered tools that exceed developer expectations."
        ),
        ValueCard(
            icon: "globe",
            title: "Global Impact",
            description: "Empowering developers worldwide to build better applications faster."
        )
    ]
    
    let stats = [
        StatItem(number: "10k+", label: "Active Developers"),
        StatItem(number: "100k+", label: "Apps Generated"),
        StatItem(number: "50+", label: "Countries Served"),
        StatItem(number: "99.9%", label: "Platform Uptime")
    ]
    
    let differences = [
        DifferenceCard(
            title: "AI-First Approach",
            description: "Built from the ground up with AI at its core, understanding developer needs and generating intelligent solutions."
        ),
        DifferenceCard(
            title: "Advanced Code Generation",
            description: "State-of-the-art AI models that generate production-ready code with comprehensive testing."
        ),
        DifferenceCard(
            title: "Smart Templates",
            description: "Intelligent templates that adapt to your specific needs, reducing development time by up to 80%."
        ),
        DifferenceCard(
            title: "Seamless Integration",
            description: "Works with your favorite tools and platforms, from GitHub to Vercel and beyond."
        )
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Section
                heroSection
                
                // Mission Section
                missionSection
                
                // Values Section
                valuesSection
                
                // What Makes Us Different
                differencesSection
                
                // Team Section
                teamSection
            }
        }
        .background(Color(.systemBackground))
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.large)
    }
    
    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: 32) {
            VStack(alignment: .leading, spacing: 24) {
                Text("Transforming Software Development")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Celiador was founded with a simple mission: to make software development accessible, fast, and efficient for developers of all skill levels. We're building the future of AI-powered development.")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .lineLimit(nil)
                    .multilineTextAlignment(.leading)
                
                // Stats Grid
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    ForEach(stats, id: \.label) { stat in
                        stat
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            
            // Team illustration
            Image("team-illustration")
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
    
    // MARK: - Mission Section
    private var missionSection: some View {
        VStack(spacing: 40) {
            Text("Our Mission")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.primary)
            
            Text("To revolutionize software development by creating an intelligent, intuitive, and efficient platform that empowers developers globally. We believe that every developer deserves access to fast, smart, and reliable development tools.")
                .font(.title3)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
            
            // Mission quote card
            VStack(spacing: 16) {
                Text("""
We're not just building development tools – we're democratizing software creation, empowering innovation, and accelerating digital transformation.
""")
                    .font(.title2)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                    .italic()
                    .multilineTextAlignment(.center)
                
                Text("— Celiador Leadership Team")
                    .font(.body)
                    .foregroundColor(.secondary)
            }
            .padding(32)
            .background(
                LinearGradient(
                    colors: [Color.blue.opacity(0.05), Color.green.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(16)
            .padding(.horizontal, 20)
        }
        .padding(.vertical, 60)
    }
    
    // MARK: - Values Section
    private var valuesSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("Our Values")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("The principles that guide everything we do")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                ForEach(values, id: \.title) { value in
                    value
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
        .background(Color(.systemGray6))
    }
    
    // MARK: - Differences Section
    private var differencesSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("What Makes Celiador Different")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("In a crowded development tool landscape, we stand out through AI innovation and commitment to our users")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                ForEach(differences, id: \.title) { difference in
                    difference
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
    
    // MARK: - Team Section
    private var teamSection: some View {
        VStack(spacing: 40) {
            VStack(spacing: 16) {
                Text("Leadership Team")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Our leadership team combines decades of experience in AI, software development, and developer tooling to deliver exceptional solutions for our users.")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            VStack(spacing: 16) {
                Text("With backgrounds spanning Google, Microsoft, OpenAI, and successful dev tool startups, our team brings both deep technical knowledge and innovative AI thinking to every challenge.")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(32)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
        .background(Color(.systemGray6))
    }
}

// MARK: - Supporting Views
struct ValueCard: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 64, height: 64)
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
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

struct StatItem: View {
    let number: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(number)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.blue)
            
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct DifferenceCard: View {
    let title: String
    let description: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding(20)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

#Preview {
    AboutView()
} 
