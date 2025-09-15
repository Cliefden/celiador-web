//
//  UserProfileEditSheet.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI
import Supabasable
import Naming
import OptionalHelpers

struct UserProfileEditSheet: View {
    let profile: Profile
    @Environment(\.dismiss) private var dismiss
    
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var fullName: String = ""
    @State private var phoneNumber: String = ""
    @State private var website: String = ""
    @State private var role: String = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Edit User Profile")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("Cancel") {
                    dismiss()
                }
                .keyboardShortcut(.cancelAction)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // Content
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Read-only Information
                    GroupBox("User Information (Read-Only)") {
                        VStack(alignment: .leading, spacing: 12) {
                            InfoRow(title: "User ID", value: profile.id?.uuidString ?? "N/A")
                            InfoRow(title: "Username", value: profile.username.uW)
                            InfoRow(title: "Created", value: profile.createdAt?.formatted(date: .abbreviated, time: .shortened) ?? "Unknown")
                            InfoRow(title: "Last Updated", value: profile.updatedAt?.formatted(date: .abbreviated, time: .shortened) ?? "Never")
                        }
                    }
                    
                    // Editable Fields
                    GroupBox("Editable Profile Information") {
                        VStack(alignment: .leading, spacing: 16) {
                            // Name
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Display Name")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                TextField("Enter display name", text: $name)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            // Full Name
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Full Name")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                TextField("Enter full name", text: $fullName)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            // Email
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Email Address")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                TextField("Enter email address", text: $email)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            // Phone Number
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Phone Number")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                TextField("Enter phone number", text: $phoneNumber)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            // Website
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Website")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                TextField("Enter website URL", text: $website)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            // Role
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Role")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                TextField("Enter user role", text: $role)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                        }
                    }
                    
                    // Action Buttons
                    HStack {
                        Spacer()
                        
                        Button("Cancel") {
                            dismiss()
                        }
                        
                        Button("Save Changes") {
                            saveChanges()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
                .padding()
            }
        }
        .frame(minWidth: 500, minHeight: 600)
        .onFirstAppear {
            loadProfileData()
        }
    }
    
    private func loadProfileData() {
        name = profile.uWName
        email = profile.email.uW
        fullName = profile.fullName.uW
        phoneNumber = profile.phoneNumber.uW
        website = profile.website.uW
        role = profile.role?.rawValue ?? ""
    }
    
    private func saveChanges() {
        // TODO: Implement profile update logic
        // This would typically call your Supabase update method
        print("Saving profile changes:")
        print("Name: \(name)")
        print("Email: \(email)")
        print("Full Name: \(fullName)")
        print("Phone: \(phoneNumber)")
        print("Website: \(website)")
        print("Role: \(role)")
        
        dismiss()
    }
}

#Preview {
    // Create a sample profile for preview
    let sampleProfile = Profile()
    UserProfileEditSheet(profile: sampleProfile)
}