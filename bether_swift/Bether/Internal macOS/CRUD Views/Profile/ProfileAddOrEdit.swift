//  ProfileAddOrEdit.swift
//  Internal macOS
//
//  Created by AI Assistant on 2025-08-14.

import SwiftUI
import Supabasable

struct ProfileAddOrEdit: View {
    let itemToEdit: Profile?
    
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var phoneNumber: String = ""
    @Environment(\.dismiss) private var dismiss

    var isEditing: Bool {
        itemToEdit != nil
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Profile Information")) {
                    TextField("Name", text: $name)
                    TextField("Email", text: $email)
                    TextField("Phone Number", text: $phoneNumber)
                }
            }
            .navigationTitle(isEditing ? "Edit Profile" : "Add Profile")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveProfile()
                    }
                    .disabled(name.isEmpty || email.isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                if let item = itemToEdit {
                    name = item.name.uW
                    email = item.email.uW
                    phoneNumber = item.phoneNumber.uW
                }
            }
        }
    }
    
    func saveProfile() {
        // Implement save logic here
        // For example, update existing profile or add a new one.
        dismiss()
    }
}
