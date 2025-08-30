//
//  AboutSheet.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct AboutSheet: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // App Icon
                    Circle()
                        .fill(Color.blue.opacity(0.1))
                        .frame(width: 100, height: 100)
                        .overlay(
                            Image(systemName: "brain")
                                .font(.system(size: 50))
                                .foregroundColor(.blue)
                        )
                    
                    VStack(spacing: 8) {
                        Text("Bether")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text("AI-Powered Development Platform")
                            .font(.body)
                            .foregroundColor(.secondary)
                        
                        Text("Version 1.0.0 (Build 1)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("About")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("Bether helps developers build better applications faster with AI-powered code generation, smart templates, and seamless deployment.")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding()
            }
            .navigationTitle("About")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                trailing: Button("Done") { dismiss() }
            )
        }
    }
}
