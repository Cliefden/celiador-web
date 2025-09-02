//
//  CreateProjectSheet.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct CreateProjectSheet: View {
//    @Binding var projects: [Project]
    @Environment(\.dismiss) private var dismiss
    @State private var projectName = ""
    @State private var selectedTemplate = ProjectTemplate.nextjsApp
    @State private var projectDescription = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Create New Project")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text("Tell our AI what you want to build and we'll generate it for you.")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    VStack(spacing: 20) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Project Name")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextField("My Awesome App", text: $projectName)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Template")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 12) {
                                ForEach(ProjectTemplate.allCases, id: \.self) { template in
                                    TemplateOption(
                                        template: template,
                                        isSelected: selectedTemplate == template
                                    ) {
                                        selectedTemplate = template
                                    }
                                }
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Description (Optional)")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextEditor(text: $projectDescription)
                                .frame(minHeight: 100)
                                .padding(8)
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                        }
                    }
                    
                    Button("Create Project") {
                        createProject()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(projectName.isEmpty)
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() },
                trailing: EmptyView()
            )
        }
    }
    
    private func createProject() {
//        let newProject = Project(
//            id: UUID(),
//            name: projectName,
//            template: selectedTemplate,
//            status: .generating,
//            lastUpdated: Date(),
//            description: projectDescription.isEmpty ? nil : projectDescription
//        )
//        projects.insert(newProject, at: 0)
        dismiss()
    }
}

