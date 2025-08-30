//
//  TemplateDetailSheet.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct TemplateDetailSheet: View {
    let template: Template
    @Environment(\.dismiss) private var dismiss
    @State private var showingCreateProject = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 16) {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(
                                LinearGradient(
                                    colors: template.colors,
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(height: 200)
                            .overlay(
                                VStack {
                                    Text(template.emoji)
                                        .font(.system(size: 48))
                                    
                                    Text(template.name)
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                }
                            )
                        
                        HStack {
                            HStack(spacing: 4) {
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                                Text("\(template.rating, specifier: "%.1f")")
                                    .fontWeight(.semibold)
                            }
                            
                            Spacer()
                            
                            Text(template.difficulty.displayName)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(template.difficulty.color.opacity(0.1))
                                .foregroundColor(template.difficulty.color)
                                .cornerRadius(16)
                        }
                        .font(.subheadline)
                    }
                    
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(template.longDescription)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    
                    // Features
                    VStack(alignment: .leading, spacing: 12) {
                        Text("What's Included")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        ForEach(template.features, id: \.self) { feature in
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                Text(feature)
                                    .font(.body)
                                    .foregroundColor(.primary)
                            }
                        }
                    }
                    
                    // Tech Stack
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Tech Stack")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 8) {
                            ForEach(template.techStack, id: \.self) { tech in
                                Text(tech)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color(.systemGray6))
                                    .cornerRadius(6)
                            }
                        }
                    }
                    
                    // CTA Button
                    Button("Use This Template") {
                        showingCreateProject = true
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .frame(maxWidth: .infinity)
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: EmptyView(),
                trailing: Button("Done") { dismiss() }
            )
        }
        .sheet(isPresented: $showingCreateProject) {
            // This would navigate to project creation with this template pre-selected
            Text("Create Project with \(template.name)")
        }
    }
}
