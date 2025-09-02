//
//  TemplateManagementView.swift
//  Bether
//
//  Created by Claude on 2025-09-02.
//

import SwiftUI
import Supabasable
import OptionalHelpers

struct TemplateManagementView: View {
    @State private var templates = SBTableViewModel<Template>()
    @State private var categories = SBTableViewModel<TemplateCategory>()
    @State private var features = SBTableViewModel<TemplateFeature>()
    @State private var techStack = SBTableViewModel<TemplateTechStack>()
    @State private var selectedTemplate: Template?
    @State private var isLoading = false
    @State private var searchText = ""
    @State private var selectedCategory: TemplateCategory?
    @State private var showInactiveTemplates = false
    
    // MARK: - Computed Properties
    
    var filteredTemplates: [Template] {
        templates.items
            .filter { template in
                if !showInactiveTemplates && template.isActive != true {
                    return false
                }
                if !searchText.isEmpty {
                    let searchLower = searchText.lowercased()
                    return template.name?.lowercased().contains(searchLower) == true ||
                           template.description?.lowercased().contains(searchLower) == true ||
                           template.templateKey?.lowercased().contains(searchLower) == true
                }
                if let selectedCategory = selectedCategory {
                    // Would need junction table check - simplified for now
                    return true
                }
                return true
            }
            .sorted { 
                ($0.sortOrder ?? 999) < ($1.sortOrder ?? 999)
            }
    }
    
    var activeTemplateCount: Int {
        templates.items.filter { $0.isActive == true && $0.deletedAt == nil }.count
    }
    
    var inactiveTemplateCount: Int {
        templates.items.filter { $0.isActive != true && $0.deletedAt == nil }.count
    }
    
    // MARK: - View Body
    
    var body: some View {
        NavigationSplitView {
            // Sidebar
            VStack(alignment: .leading, spacing: 16) {
                // Header
                headerSection
                
                // Stats Cards
                statsSection
                
                // Filters
                filtersSection
                
                // Template List
                templateListSection
            }
            .padding()
            .frame(minWidth: 300)
        } detail: {
            // Detail View
            if let selectedTemplate = selectedTemplate {
                TemplateDetailView(template: selectedTemplate)
            } else {
                VStack {
                    Image(systemName: "square.grid.2x2")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    Text("Select a template")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Text("Choose a template from the list to view details")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Template Management")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: refreshData) {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(isLoading)
            }
        }
        .onFirstAppear {
            templates.addListener()
            categories.addListener()
            features.addListener()
            techStack.addListener()
            refreshData()
        }
        .onDisappear {
            templates.cancelListener()
            categories.cancelListener()
            features.cancelListener()
            techStack.cancelListener()
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "square.grid.2x2.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text("Templates")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            Text("Manage project templates and their configurations")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Stats Section
    
    private var statsSection: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Active",
                value: "\(activeTemplateCount)",
                color: .green
            )
            
            StatCard(
                title: "Inactive", 
                value: "\(inactiveTemplateCount)",
                color: .orange
            )
            
            StatCard(
                title: "Categories",
                value: "\(categories.items.filter { $0.deletedAt == nil }.count)",
                color: .purple
            )
        }
    }
    
    // MARK: - Filters Section
    
    private var filtersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Search
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                
                TextField("Search templates...", text: $searchText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Category Filter
            VStack(alignment: .leading, spacing: 6) {
                Text("Category")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                Picker("Category", selection: $selectedCategory) {
                    Text("All Categories").tag(nil as TemplateCategory?)
                    ForEach(categories.items.filter { $0.deletedAt == nil }, id: \.id) { category in
                        Text(category.name.uW).tag(category as TemplateCategory?)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            
            // Show Inactive Toggle
            Toggle("Show inactive templates", isOn: $showInactiveTemplates)
                .font(.caption)
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(8)
    }
    
    // MARK: - Template List Section
    
    private var templateListSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Templates (\(filteredTemplates.count))")
                .font(.headline)
            
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(filteredTemplates, id: \.id) { template in
                        TemplateRowView(
                            template: template,
                            isSelected: selectedTemplate?.id == template.id
                        )
                        .onTapGesture {
                            selectedTemplate = template
                        }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
    
    // MARK: - Actions
    
    private func refreshData() {
        isLoading = true
        
        Task {
            try? await Task.sleep(nanoseconds: 500_000_000)
            await MainActor.run {
                isLoading = false
            }
        }
    }
}

// MARK: - Template Row View

struct TemplateRowView: View {
    let template: Template
    let isSelected: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon/Emoji
            Group {
                if let emoji = template.emoji, !emoji.isEmpty {
                    Text(emoji)
                        .font(.title2)
                } else {
                    Image(systemName: template.icon ?? "square.grid.2x2")
                        .font(.title3)
                        .foregroundColor(template.primaryColor)
                }
            }
            .frame(width: 32, height: 32)
            .background(template.primaryColor.opacity(0.1))
            .cornerRadius(8)
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(template.name.uW)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    // Status badge
                    if template.isActive == true {
                        Text("Active")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.green)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(4)
                    } else {
                        Text("Inactive")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.orange)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.1))
                            .cornerRadius(4)
                    }
                }
                
                Text(template.description.uW)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                HStack {
                    Text("v\(template.version ?? "1.0")")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(template.difficulty.uW.capitalized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let rating = template.rating {
                        Text("•")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        HStack(spacing: 2) {
                            Image(systemName: "star.fill")
                                .font(.caption)
                                .foregroundColor(.yellow)
                            Text(String(format: "%.1f", rating))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .background(isSelected ? Color.accentColor.opacity(0.1) : Color(.controlBackgroundColor))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 2)
        )
    }
}

// MARK: - Template Detail View

struct TemplateDetailView: View {
    let template: Template
    @State private var categoriesJunction = SBTableViewModel<TemplatesCategoriesJunction>()
    @State private var featuresJunction = SBTableViewModel<TemplatesFeaturesJunction>()
    @State private var techStackJunction = SBTableViewModel<TemplatesTechStackJunction>()
    @State private var allCategories = SBTableViewModel<TemplateCategory>()
    @State private var allFeatures = SBTableViewModel<TemplateFeature>()
    @State private var allTechStack = SBTableViewModel<TemplateTechStack>()
    
    var templateCategories: [TemplateCategory] {
        let categoryIds = categoriesJunction.items
            .filter { $0.templateId == template.id }
            .compactMap { $0.categoryId }
        
        return allCategories.items.filter { category in
            categoryIds.contains(category.id.uW)
        }
    }
    
    var templateFeatures: [TemplateFeature] {
        let featureIds = featuresJunction.items
            .filter { $0.templateId == template.id }
            .compactMap { $0.featureId }
        
        return allFeatures.items.filter { feature in
            featureIds.contains(feature.id.uW)
        }
    }
    
    var templateTechStack: [TemplateTechStack] {
        let techIds = techStackJunction.items
            .filter { $0.templateId == template.id }
            .compactMap { $0.techId }
        
        return allTechStack.items.filter { tech in
            techIds.contains(tech.id.uW)
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                templateHeaderSection
                
                // Basic Info
                basicInfoSection
                
                // Technical Details
                technicalDetailsSection
                
                // Associated Data
                associatedDataSection
            }
            .padding()
        }
        .navigationTitle(template.name ?? "Template")
        .onFirstAppear {
            setupViewModels()
        }
        .onDisappear {
            teardownViewModels()
        }
    }
    
    private var templateHeaderSection: some View {
        HStack(spacing: 16) {
            // Large icon
            Group {
                if let emoji = template.emoji, !emoji.isEmpty {
                    Text(emoji)
                        .font(.system(size: 48))
                } else {
                    Image(systemName: template.icon ?? "square.grid.2x2")
                        .font(.system(size: 48))
                        .foregroundColor(template.primaryColor)
                }
            }
            .frame(width: 80, height: 80)
            .background(template.primaryColor.opacity(0.1))
            .cornerRadius(16)
            
            VStack(alignment: .leading, spacing: 8) {
                Text(template.name.uW)
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(template.description.uW)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                HStack {
                    Label("v\(template.version ?? "1.0")", systemImage: "number")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Label(template.difficulty.uW.capitalized, systemImage: "gauge")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
    }
    
    private var basicInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Description")
                .font(.headline)
            
            Text(template.longDescription ?? template.description ?? "No description available")
                .font(.body)
                .foregroundColor(.primary)
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(12)
    }
    
    private var technicalDetailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Technical Details")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 8) {
                DetailRow(label: "Template Key", value: template.templateKey ?? "N/A")
                DetailRow(label: "Storage Path", value: template.storagePath ?? "N/A")
                DetailRow(label: "Sort Order", value: "\(template.sortOrder ?? 0)")
                DetailRow(label: "Rating", value: template.rating.map { String(format: "%.1f", $0) } ?? "N/A")
                DetailRow(label: "Status", value: template.isActive == true ? "Active" : "Inactive")
            }
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(12)
    }
    
    private var associatedDataSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Associated Data")
                .font(.headline)
            
            HStack(alignment: .top, spacing: 16) {
                // Categories
                VStack(alignment: .leading, spacing: 8) {
                    Text("Categories")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if templateCategories.isEmpty {
                        Text("No categories")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(templateCategories, id: \.id) { category in
                            Label(category.name.uW, systemImage: "folder")
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
                
                // Features
                VStack(alignment: .leading, spacing: 8) {
                    Text("Features")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if templateFeatures.isEmpty {
                        Text("No features")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(templateFeatures, id: \.id) { feature in
                            Label(feature.name.uW, systemImage: "star")
                                .font(.caption)
                                .foregroundColor(.purple)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
                
                // Tech Stack
                VStack(alignment: .leading, spacing: 8) {
                    Text("Tech Stack")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if templateTechStack.isEmpty {
                        Text("No tech stack")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(templateTechStack, id: \.id) { tech in
                            Label(tech.name.uW, systemImage: "hammer")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
            }
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(12)
    }
    
    // MARK: - Actions
    
    private func setupViewModels() {
        categoriesJunction.addListener()
        featuresJunction.addListener()
        techStackJunction.addListener()
        allCategories.addListener()
        allFeatures.addListener()
        allTechStack.addListener()
    }
    
    private func teardownViewModels() {
        categoriesJunction.cancelListener()
        featuresJunction.cancelListener()
        techStackJunction.cancelListener()
        allCategories.cancelListener()
        allFeatures.cancelListener()
        allTechStack.cancelListener()
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct DetailRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 100, alignment: .leading)
            
            Text(value)
                .font(.caption)
                .foregroundColor(.primary)
            
            Spacer()
        }
    }
}

