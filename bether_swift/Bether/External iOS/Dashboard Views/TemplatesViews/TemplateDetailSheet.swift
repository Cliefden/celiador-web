//
//  TemplateDetailSheet.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI
import OptionalHelpers
import Supabasable

struct TemplateDetailSheet: View {
    let template: Template
    @Environment(\.dismiss) private var dismiss
    @State private var showingCreateProject = false
    @State private var features = SBTableViewModel<TemplateFeature>()
    @State private var techStack = SBTableViewModel<TemplateTechStack>()
    @State private var templateFeatures = SBTableViewModel<TemplatesFeaturesJunction>()
    @State private var templateTechStack = SBTableViewModel<TemplatesTechStackJunction>()
    
    // Helper method to get features for this template
    var templateFeaturesList: [TemplateFeature] {
        guard let templateId = template.id else { return [] }
        
        let featureIds = templateFeatures.items
            .filter { $0.deleter == nil && $0.templateId == templateId }
            .compactMap { $0.featureId }
        
        return features.items.filter { feature in
            guard let featureId = feature.id else { return false }
            return featureIds.contains(featureId) && feature.deleter == nil
        }
    }
    
    // Helper method to get tech stack for this template
    var templateTechStackList: [TemplateTechStack] {
        guard let templateId = template.id else { return [] }
        
        let techIds = templateTechStack.items
            .filter { $0.deleter == nil && $0.templateId == templateId }
            .compactMap { $0.techId }
        
        return techStack.items.filter { tech in
            guard let techId = tech.id else { return false }
            return techIds.contains(techId) && tech.deleter == nil
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 16) {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(
                                LinearGradient(
                                    colors: [template.primaryColor, template.secondaryColor ?? template.primaryColor],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(height: 200)
                            .overlay(
                                VStack {
                                    Text(template.emoji.uW)
                                        .font(.system(size: 48))
                                    
                                    Text(template.name.uW)
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                }
                            )
                        
                        HStack {
                            HStack(spacing: 4) {
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                                Text("\(template.rating ?? 0.0, specifier: "%.1f")")
                                    .fontWeight(.semibold)
                            }
                            
                            Spacer()
                            
                            Text(template.difficultyEnum.displayName)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(template.difficultyEnum.color.opacity(0.1))
                                .foregroundColor(template.difficultyEnum.color)
                                .cornerRadius(16)
                        }
                        .font(.subheadline)
                    }
                    
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(template.longDescription.uW)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    
                    // Features
                    VStack(alignment: .leading, spacing: 12) {
                        Text("What's Included")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        ForEach(templateFeaturesList, id: \.id) { feature in
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                Text(feature.name.uW)
                                    .font(.body)
                                    .foregroundColor(.primary)
                            }
                        }
                        
                        if templateFeaturesList.isEmpty {
                            Text("No features available")
                                .font(.body)
                                .foregroundColor(.secondary)
                                .italic()
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
                            ForEach(templateTechStackList, id: \.id) { tech in
                                Text(tech.name.uW)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color(.systemGray6))
                                    .cornerRadius(6)
                            }
                        }
                        
                        if templateTechStackList.isEmpty {
                            Text("No tech stack information available")
                                .font(.body)
                                .foregroundColor(.secondary)
                                .italic()
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
            Text("Create Project with \(template.name.uW)")
        }
        .onFirstAppear {
            features.addListener()
            techStack.addListener()
            templateFeatures.addListener()
            templateTechStack.addListener()
        }
        .onDisappear {
            features.cancelListener()
            techStack.cancelListener()
            templateFeatures.cancelListener()
            templateTechStack.cancelListener()
        }
    }
}
