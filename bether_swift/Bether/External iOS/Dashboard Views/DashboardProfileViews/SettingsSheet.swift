//
//  SettingsSheet.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct SettingsSheet: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                Section("Preferences") {
                    HStack {
                        Image(systemName: "paintbrush")
                        Text("Theme")
                        Spacer()
                        Text("System")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Image(systemName: "bell")
                        Text("Notifications")
                        Spacer()
                        Toggle("", isOn: .constant(true))
                    }
                }
                
                Section("Development") {
                    HStack {
                        Image(systemName: "terminal")
                        Text("Default Template")
                        Spacer()
                        Text("Next.js")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Image(systemName: "cloud")
                        Text("Auto Deploy")
                        Spacer()
                        Toggle("", isOn: .constant(false))
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                trailing: Button("Done") { dismiss() }
            )
        }
    }
}
