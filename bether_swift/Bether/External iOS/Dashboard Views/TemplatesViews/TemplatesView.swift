//
//  TemplatesView.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-29.
//

import SwiftUI

struct TemplatesView: View {
    @State private var selectedCategory: TemplateCategory = .all
    @State private var searchText = ""
    @State private var showingTemplateDetail: Template? = nil
    
    var filteredTemplates: [Template] {
        var templates = sampleTemplates
        
        // Filter by category
        if selectedCategory != .all {
            templates = templates.filter { $0.category == selectedCategory }
        }
        
        // Filter by search
        if !searchText.isEmpty {
            templates = templates.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.description.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return templates
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 16) {
                Text("✨ Magic Templates")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text("Start with stunning templates and launch in minutes, not weeks")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [Color.purple.opacity(0.1), Color.blue.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            
            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                
                TextField("Search templates...", text: $searchText)
                    .textFieldStyle(PlainTextFieldStyle())
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .padding(.horizontal)
            .padding(.top)
            
            // Category Filter
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(TemplateCategory.allCases, id: \.self) { category in
                        CategoryChip(
                            category: category,
                            isSelected: selectedCategory == category
                        ) {
                            selectedCategory = category
                        }
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
            
            // Templates Grid
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    ForEach(filteredTemplates) { template in
                        TemplateCard(template: template) {
                            showingTemplateDetail = template
                        }
                    }
                }
                .padding()
            }
        }
        .sheet(item: $showingTemplateDetail) { template in
            TemplateDetailSheet(template: template)
        }
    }
    
}






// MARK: - Data Models
struct Template: Identifiable {
    let id: UUID
    let name: String
    let description: String
    let longDescription: String
    let category: TemplateCategory
    let icon: String
    let emoji: String
    let colors: [Color]
    let rating: Double
    let difficulty: TemplateDifficulty
    let features: [String]
    let techStack: [String]
}



// Sample data
let sampleTemplates = [
    Template(
        id: UUID(),
        name: "SaaS Starter Kit",
        description: "Complete SaaS application with auth, payments, and dashboard",
        longDescription: "A comprehensive SaaS starter kit with user authentication, subscription management, payment processing, and a beautiful dashboard. Perfect for launching your next SaaS product quickly.",
        category: .saas,
        icon: "cloud",
        emoji: "🚀",
        colors: [.blue, .purple],
        rating: 4.8,
        difficulty: .intermediate,
        features: [
            "User Authentication",
            "Stripe Integration",
            "Admin Dashboard",
            "Email Templates",
            "Database Schema",
            "Responsive Design"
        ],
        techStack: ["Next.js", "TypeScript", "Tailwind", "Stripe", "Supabase"]
    ),
    Template(
        id: UUID(),
        name: "AI Chat Assistant",
        description: "Smart chatbot with OpenAI integration and beautiful UI",
        longDescription: "An intelligent chat assistant powered by OpenAI's GPT models. Features real-time conversations, message history, and customizable AI personalities.",
        category: .ai,
        icon: "brain",
        emoji: "🤖",
        colors: [.purple, .pink],
        rating: 4.9,
        difficulty: .advanced,
        features: [
            "OpenAI Integration",
            "Real-time Chat",
            "Message History",
            "Custom AI Personas",
            "File Uploads",
            "Voice Input"
        ],
        techStack: ["React", "OpenAI API", "WebSocket", "Node.js", "MongoDB"]
    ),
    Template(
        id: UUID(),
        name: "E-commerce Store",
        description: "Full-featured online store with cart and payments",
        longDescription: "A complete e-commerce solution with product catalog, shopping cart, checkout process, and order management. Ready to start selling online immediately.",
        category: .ecommerce,
        icon: "cart",
        emoji: "🛍️",
        colors: [.green, .blue],
        rating: 4.7,
        difficulty: .intermediate,
        features: [
            "Product Catalog",
            "Shopping Cart",
            "Payment Processing",
            "Order Management",
            "Inventory Tracking",
            "Customer Accounts"
        ],
        techStack: ["Next.js", "Stripe", "Prisma", "PostgreSQL", "Redis"]
    ),
    Template(
        id: UUID(),
        name: "Analytics Dashboard",
        description: "Beautiful dashboard with charts and real-time data",
        longDescription: "A comprehensive analytics dashboard with interactive charts, real-time data updates, and customizable widgets. Perfect for monitoring business metrics.",
        category: .dashboard,
        icon: "chart.bar",
        emoji: "📊",
        colors: [.orange, .red],
        rating: 4.6,
        difficulty: .beginner,
        features: [
            "Interactive Charts",
            "Real-time Updates",
            "Custom Widgets",
            "Data Export",
            "User Roles",
            "Mobile Responsive"
        ],
        techStack: ["React", "Chart.js", "WebSocket", "Express", "MySQL"]
    ),
    Template(
        id: UUID(),
        name: "Landing Page Pro",
        description: "High-converting landing page with modern design",
        longDescription: "A professionally designed landing page template with high conversion optimization, A/B testing support, and integrated analytics.",
        category: .landing,
        icon: "doc.text",
        emoji: "📄",
        colors: [.blue, .green],
        rating: 4.5,
        difficulty: .beginner,
        features: [
            "High Conversion Design",
            "A/B Testing",
            "Contact Forms",
            "Analytics Integration",
            "SEO Optimized",
            "Fast Loading"
        ],
        techStack: ["HTML", "CSS", "JavaScript", "Tailwind", "Alpine.js"]
    ),
    Template(
        id: UUID(),
        name: "Task Manager App",
        description: "Collaborative task management with teams and projects",
        longDescription: "A full-featured task management application with team collaboration, project organization, and productivity tracking.",
        category: .saas,
        icon: "checkmark.circle",
        emoji: "✅",
        colors: [.purple, .blue],
        rating: 4.4,
        difficulty: .intermediate,
        features: [
            "Task Management",
            "Team Collaboration",
            "Project Organization",
            "Time Tracking",
            "Notifications",
            "File Attachments"
        ],
        techStack: ["Vue.js", "Node.js", "MongoDB", "Socket.io", "Redis"]
    )
]

#Preview {
    TemplatesView()
}
