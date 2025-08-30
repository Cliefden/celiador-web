//
//  ProjectDetailiOS.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI
import Supabasable
import OptionalHelpers
import Auth

struct ProjectDetailiOS: View {
    let project: Project
    @Environment(SBAuthViewModel.self) var auth
    @State private var showingCommandSheet = false
    @State private var selectedCommand: String = ""
    @State private var showingDeleteAlert = false
    @State private var commands = SBTableViewModel<ProjectCommand>()
    @State private var commandText = ""
    @State private var isSubmittingCommand = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Project Header
                projectHeader
                
                // Quick Actions
                quickActions
                
                // Project Details
                projectDetails
                
                // Environment Variables
                if let env = project.env {
                    environmentSection(env)
                }
                
                // Command Input
                commandInputSection
                
                // Command History
                commandHistorySection
                
                // Danger Zone
                dangerZone
            }
            .padding()
        }
        .onFirstAppear {
            commands.addListener()
        }
        .onDisappear {
            commands.cancelListener()
        }
        .navigationTitle(project.name.uW)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        selectedCommand = "deploy"
                        showingCommandSheet = true
                    } label: {
                        Label("Deploy", systemImage: "arrow.up.circle")
                    }
                    
                    Button {
                        selectedCommand = "rebuild"
                        showingCommandSheet = true
                    } label: {
                        Label("Rebuild", systemImage: "hammer")
                    }
                    
                    if let repoProvider = project.repoProvider,
                       let repoOwner = project.repoOwner,
                       let repoName = project.repoName {
                        Button {
                            // Open repository
                        } label: {
                            Label("Open \(repoProvider)", systemImage: "globe")
                        }
                    }
                    
                    Divider()
                    
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
                        Label("Delete Project", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingCommandSheet) {
            CommandSheet(project: project, command: selectedCommand)
        }
        .alert("Delete Project", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                // Handle project deletion
            }
        } message: {
            Text("Are you sure you want to delete '\(project.name.uW)'? This action cannot be undone.")
        }
        .onAppear {
            commands.addListener()
        }
        .onDisappear {
            commands.cancelListener()
        }
    }
    
    private var projectHeader: some View {
        VStack(spacing: 16) {
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 12, height: 12)
                
                Text(project.status.uW.uppercased())
                    .font(.headline)
                    .foregroundColor(statusColor)
                
                Spacer()
                
                Text("ID: \(String(project.id.uW.uuidString.prefix(8)))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if let repoProvider = project.repoProvider,
               let repoOwner = project.repoOwner,
               let repoName = project.repoName {
                HStack {
                    Image(systemName: "link")
                        .foregroundColor(.blue)
                    Text("\(repoProvider)/\(repoOwner)/\(repoName)")
                        .font(.body)
                        .foregroundColor(.blue)
                    Spacer()
                }
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [statusColor.opacity(0.1), Color.clear],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
    }
    
    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.primary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                QuickActionButton(
                    title: "Deploy",
                    icon: "arrow.up.circle",
                    color: .blue
                ) {
                    selectedCommand = "deploy"
                    showingCommandSheet = true
                }
                
                QuickActionButton(
                    title: "Generate",
                    icon: "brain",
                    color: .purple
                ) {
                    selectedCommand = "generate"
                    showingCommandSheet = true
                }
                
                QuickActionButton(
                    title: "View Logs",
                    icon: "doc.text",
                    color: .orange
                ) {
                    selectedCommand = "logs"
                    showingCommandSheet = true
                }
                
                QuickActionButton(
                    title: "Settings",
                    icon: "gearshape",
                    color: .gray
                ) {
                    selectedCommand = "settings"
                    showingCommandSheet = true
                }
            }
        }
    }
    
    private var projectDetails: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Project Information")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                InfoRow2(label: "Template", value: project.templateKey.uW, icon: "star")
                InfoRow2(label: "Status", value: project.status.uW, icon: "circle.fill", valueColor: statusColor)
                InfoRow2(label: "Created", value: project.createdAt.uW.formatted(date: .abbreviated, time: .shortened), icon: "calendar")
                InfoRow2(label: "Updated", value: project.updatedAt.uW.formatted(date: .abbreviated, time: .shortened), icon: "clock")
                
                if let userId = project.userId {
                    InfoRow2(label: "Owner", value: String(userId.uuidString.prefix(8)) + "...", icon: "person")
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        }
    }
    
    private func environmentSection(_ env: ProjectMetadata) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Environment & Configuration")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                if let envVars = env.environmentVariables, !envVars.isEmpty {
                    ForEach(Array(envVars.keys.sorted()), id: \.self) { key in
                        InfoRow2(label: key, value: envVars[key] ?? "", icon: "gear")
                    }
                }
                
                if let buildConfig = env.buildConfig, !buildConfig.isEmpty {
                    ForEach(Array(buildConfig.keys.sorted()), id: \.self) { key in
                        InfoRow2(label: key, value: buildConfig[key] ?? "", icon: "hammer")
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        }
    }
    
    private var commandInputSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Give Command")
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    TextField("Type your command here...", text: $commandText, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...4)
                    
                    Button(action: submitCommand) {
                        if isSubmittingCommand {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "paperplane.fill")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(commandText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSubmittingCommand)
                }
                
                Text("Example commands: \"Deploy to production\", \"Update dependencies\", \"Generate new component\"")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }
    
    private var commandHistorySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recent Commands")
                .font(.headline)
                .foregroundColor(.primary)
            
            if projectCommands.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "text.bubble")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    
                    Text("No commands yet")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text("Start by giving your first command above")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            } else {
                VStack {
                    ForEach(projectCommands) { command in
                        CommandRow(command: command)
                    }
                }
            }
        }
    }
    
    private var dangerZone: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Danger Zone")
                .font(.headline)
                .foregroundColor(.red)
            
            Button("Delete Project") {
                showingDeleteAlert = true
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red.opacity(0.1))
            .foregroundColor(.red)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.red.opacity(0.3), lineWidth: 1)
            )
        }
    }
    
    private var statusColor: Color {
        switch project.status.uW.uppercased() {
        case "PENDING": return .orange
        case "GENERATING": return .blue
        case "READY": return .green
        case "DEPLOYED": return .purple
        case "ERROR": return .red
        default: return .gray
        }
    }
    
    private var projectCommands: [ProjectCommand] {
        commands.items.filter {
            $0.projectId == project.id && $0.deleter == nil
        }.sorted {
            ($0.createdAt ?? Date.distantPast) > ($1.createdAt ?? Date.distantPast)
        }
    }
    
    private func submitCommand() {
        
        guard !commandText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let projectId = project.id else { return }
        
        isSubmittingCommand = true
        
        let newCommand = ProjectCommand(
            projectId: projectId,
            commandText: commandText.trimmingCharacters(in: .whitespacesAndNewlines),
            commandType: "text",
            status: "pending"
        )
        
        SBTableManager.create(newCommand)
        
        commandText = ""
        isSubmittingCommand = false
        commands.items.append(newCommand)
    }
}

#Preview {
    NavigationView {
        ProjectDetailiOS(project: Project(
            id: UUID(),
            createdAt: Date(),
            creator: nil,
            updater: nil,
            updatedAt: Date(),
            deleter: nil,
            deletedAt: nil,
            name: "Sample Project",
            templateKey: "ai-chat",
            status: "READY",
            repoProvider: "github",
            repoOwner: "user",
            repoName: "sample-repo",
            env: nil,
            userId: UUID()
        ))
    }
}
