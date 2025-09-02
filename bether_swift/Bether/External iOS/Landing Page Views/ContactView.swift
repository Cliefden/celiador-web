//
//  ContactView.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-01-30.
//

import SwiftUI

struct ContactView: View {
    @State private var formData = ContactFormData()
    @State private var showingAlert = false
    
    let contactInfo = [
        ContactInfoCard(
            icon: "envelope",
            title: "Email Us",
            details: "contact@celiador.com",
            description: "Get in touch for general inquiries"
        ),
        ContactInfoCard(
            icon: "phone",
            title: "Call Us",
            details: "+1 (555) 123-4567",
            description: "Speak with our sales team"
        ),
        ContactInfoCard(
            icon: "location",
            title: "Visit Us",
            details: "123 Tech Street, Innovation City",
            description: "Our headquarters location"
        ),
        ContactInfoCard(
            icon: "clock",
            title: "Business Hours",
            details: "Mon-Fri: 9AM-6PM EST",
            description: "We're here to help during business hours"
        )
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Section
                heroSection
                
                // Contact Information
                contactInfoSection
                
                // Contact Form and Additional Info
                contactFormSection
            }
        }
        .background(Color(.systemBackground))
        .navigationTitle("Contact")
        .navigationBarTitleDisplayMode(.large)
        .alert("Message Sent", isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text("Thank you for your message. We'll get back to you within 24 hours.")
        }
    }
    
    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: 24) {
            Text("Get in Touch")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.primary)
            
            Text("Ready to transform your development workflow? We're here to help you get started and answer any questions about our platform.")
                .font(.title3)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.05), Color.green.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
    
    // MARK: - Contact Info Section
    private var contactInfoSection: some View {
        VStack(spacing: 40) {
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                ForEach(contactInfo, id: \.title) { info in
                    info
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
    
    // MARK: - Contact Form Section
    private var contactFormSection: some View {
        VStack(spacing: 40) {
            // Contact Form
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Send Us a Message")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("Fill out the form below and we'll get back to you within 24 hours.")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                
                VStack(spacing: 20) {
                    // Name and Email
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Full Name *")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextField("Your full name", text: $formData.name)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email Address *")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextField("your@email.com", text: $formData.email)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.emailAddress)
                        }
                    }
                    
                    // Company and Role
                    HStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Company")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextField("Your company name", text: $formData.company)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Your Role")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            Picker("Select your role", selection: $formData.role) {
                                Text("Select your role").tag("")
                                Text("Developer").tag("developer")
                                Text("Team Lead").tag("team_lead")
                                Text("Product Manager").tag("product_manager")
                                Text("Other").tag("other")
                            }
                            .pickerStyle(MenuPickerStyle())
                            .frame(maxWidth: .infinity)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                    }
                    
                    // Subject
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Subject *")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Picker("What can we help you with?", selection: $formData.subject) {
                            Text("What can we help you with?").tag("")
                            Text("Schedule a Demo").tag("demo")
                            Text("Pricing Information").tag("pricing")
                            Text("Technical Support").tag("support")
                            Text("Partnership Inquiry").tag("partnership")
                            Text("General Question").tag("general")
                        }
                        .pickerStyle(MenuPickerStyle())
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                    
                    // Message
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Message *")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        TextEditor(text: $formData.message)
                            .frame(minHeight: 120)
                            .padding(8)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color(.systemGray4), lineWidth: 1)
                            )
                    }
                    
                    // Submit Button
                    Button("Send Message") {
                        handleSubmit()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .frame(maxWidth: .infinity)
                    .disabled(!isFormValid)
                }
            }
            .padding(24)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
            
            // Additional Information
            VStack(spacing: 20) {
                AdditionalInfoCard(
                    title: "Sales Inquiries",
                    description: "Interested in learning more about our platform? Our sales team is ready to show you how Celiador can transform your development workflow.",
                    email: "sales@celiador.com",
                    phone: "+1 (555) 123-4567"
                )
                
                AdditionalInfoCard(
                    title: "Technical Support",
                    description: "Already using Celiador? Our technical support team is available 24/7 to help you with any platform-related questions or issues.",
                    email: "support@celiador.com",
                    portal: "Available in your dashboard"
                )
                
                PartnershipCard()
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 60)
    }
    
    private var isFormValid: Bool {
        !formData.name.isEmpty && 
        !formData.email.isEmpty && 
        !formData.subject.isEmpty && 
        !formData.message.isEmpty
    }
    
    private func handleSubmit() {
        // Handle form submission
        print("Form submitted:", formData)
        showingAlert = true
        formData = ContactFormData() // Reset form
    }
}

// MARK: - Supporting Views
struct ContactInfoCard: View {
    let icon: String
    let title: String
    let details: String
    let description: String
    
    var body: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 48, height: 48)
                .overlay(
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(.blue)
                )
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(details)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(.blue)
                
                Text(description)
                    .font(.caption)
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

struct AdditionalInfoCard: View {
    let title: String
    let description: String
    let email: String
    let phone: String?
    let portal: String?
    
    init(title: String, description: String, email: String, phone: String? = nil, portal: String? = nil) {
        self.title = title
        self.description = description
        self.email = email
        self.phone = phone
        self.portal = portal
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text(description)
                .font(.body)
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Email:")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                    Text(email)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let phone = phone {
                    HStack {
                        Text("Phone:")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                        Text(phone)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                if let portal = portal {
                    HStack {
                        Text("Portal:")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                        Text(portal)
                            .font(.caption)
                            .foregroundColor(.secondary)
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

struct PartnershipCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Partnership Opportunities")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text("Interested in partnering with Celiador? We're always looking for strategic partnerships that can benefit our mutual developers.")
                .font(.body)
                .foregroundColor(.secondary)
            
            Button("Learn About Partnerships") {
                // Handle partnership action
            }
            .buttonStyle(SecondaryButtonStyle())
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.05), Color.green.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

// MARK: - Data Models
struct ContactFormData {
    var name = ""
    var email = ""
    var company = ""
    var role = ""
    var subject = ""
    var message = ""
}

#Preview {
    ContactView()
} 