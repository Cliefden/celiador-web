//
//  ClaudeCodeView.swift
//  Bether
//
//  Created by Claude on 2025-08-31.
//

import SwiftUI
import Supabasable
import OptionalHelpers
import Auth
import Speech

enum ClaudeCodeTab: String, CaseIterable {
    case conversation = "conversation"
    case preview = "preview"
    
    var displayName: String {
        switch self {
        case .conversation: return "Chat"
        case .preview: return "Preview"
        }
    }
    
    var iconName: String {
        switch self {
        case .conversation: return "message"
        case .preview: return "display"
        }
    }
}

struct ClaudeCodeView: View {
    @Environment(SBAuthViewModel.self) var auth
    @State private var selectedProject: Project?
    @State private var projects = SBTableViewModel<Project>()
    @State private var conversations = SBTableViewModel<ClaudeCodeConversation>()
    @State private var messages = SBTableViewModel<ClaudeMessage>()
    @State private var currentConversation: ClaudeCodeConversation?
    @State private var currentMessages: [ClaudeMessage] = []
    @State private var messageText = ""
    @State private var isProcessing = false
    @State private var speechRecognizer = SpeechRecognizer()
    @State private var showingProjectPicker = false
    @State private var selectedTab: ClaudeCodeTab = .conversation
    
    var body: some View {
        VStack(spacing: 0) {
            // Project Context Header
            projectContextHeader
            
            // Tab Picker
            tabPicker
            
            // Tab Content
            TabView(selection: $selectedTab) {
                // Conversation Tab
                VStack(spacing: 0) {
                    conversationArea
                    inputArea
                }
                .tag(ClaudeCodeTab.conversation)
                
                // Preview Tab
                PreviewView(project: selectedProject)
                    .tag(ClaudeCodeTab.preview)
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        }
        .toolbar {
            ToolbarItem {
                Button("Projects") {
                    showingProjectPicker = true
                }
            }
        }
        .sheet(isPresented: $showingProjectPicker) {
            projectPickerSheet
        }
        .onFirstAppear {
            projects.addListener()
            conversations.addListener()
            messages.addListener()
            loadDefaultProject()
        }
        .onDisappear {
            projects.cancelListener()
            conversations.cancelListener()
            messages.cancelListener()
        }
        .onChange(of: selectedProject) { _, newProject in
            if let project = newProject {
                loadConversationForProject(project)
            }
        }
        .onChange(of: speechRecognizer.transcript) { _, newValue in
            if !newValue.isEmpty {
                messageText = newValue
            }
        }
    }
    
    private var tabPicker: some View {
        HStack(spacing: 0) {
            ForEach(ClaudeCodeTab.allCases, id: \.self) { tab in
                Button {
                    selectedTab = tab
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: tab.iconName)
                            .font(.caption)
                        Text(tab.displayName)
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(selectedTab == tab ? .white : .primary)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .background(selectedTab == tab ? Color.accentColor : Color.clear)
                    .cornerRadius(8)
                }
            }
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }
    
    private var projectContextHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                if let project = selectedProject {
                    Text(project.name.uW)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(project.status.uW.uppercased())
                        .font(.caption)
                        .foregroundColor(statusColor)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(statusColor.opacity(0.1))
                        .cornerRadius(4)
                } else {
                    Text("No Project Selected")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    Text("Choose a project to start coding")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Button("Switch") {
                showingProjectPicker = true
            }
            .buttonStyle(.bordered)
            .disabled(availableProjects.isEmpty)
        }
        .padding()
        .background(Color(.systemGray6))
    }
    
    private var conversationArea: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    if !currentMessages.isEmpty {
                        ForEach(Array(currentMessages.enumerated()), id: \.offset) { index, message in
                            MessageBubble(message: message)
                                .id(index)
                        }
                    } else {
                        // Welcome message
                        VStack(spacing: 16) {
                            Image(systemName: "brain.head.profile")
                                .font(.system(size: 48))
                                .foregroundColor(.purple)
                            
                            Text("Claude Code Ready")
                                .font(.title2)
                                .fontWeight(.semibold)
                            
                            Text("I can help you code, debug, and manage your projects using voice or text commands.")
                                .font(.body)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        .padding(.top, 40)
                    }
                }
                .padding()
            }
            .onChange(of: currentMessages.count) { _, _ in
                // Auto-scroll to bottom on new messages
                withAnimation(.easeOut(duration: 0.3)) {
                    if currentMessages.count > 0 {
                        proxy.scrollTo(currentMessages.count - 1, anchor: .bottom)
                    }
                }
            }
        }
    }
    
    private var inputArea: some View {
        VStack(spacing: 12) {
            // Quick Actions
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    QuickActionChip(title: "Explain Code", icon: "doc.text") {
                        messageText = "Explain the code structure of this project"
                        sendMessage()
                    }
                    
                    QuickActionChip(title: "Find Bugs", icon: "ladybug") {
                        messageText = "Review the code and find potential bugs"
                        sendMessage()
                    }
                    
                    QuickActionChip(title: "Add Feature", icon: "plus.circle") {
                        messageText = "Help me add a new feature to this project"
                        sendMessage()
                    }
                    
                    QuickActionChip(title: "Deploy", icon: "arrow.up.circle") {
                        messageText = "Deploy this project"
                        sendMessage()
                    }
                }
                .padding(.horizontal)
            }
            
            // Input Controls
            HStack(alignment: .bottom, spacing: 12) {
                // Text Input
                TextField("Ask Claude Code...", text: $messageText, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)
                
                // Voice Button
                Button(action: toggleRecording) {
                    Image(systemName: speechRecognizer.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                        .font(.title2)
                        .foregroundColor(speechRecognizer.isRecording ? .red : .purple)
                        .scaleEffect(speechRecognizer.isRecording ? 1.2 : 1.0)
                }
                .buttonStyle(.bordered)
                .disabled(!speechRecognizer.isAvailable)
                .animation(.easeInOut(duration: 0.1), value: speechRecognizer.isRecording)
                
                // Send Button
                Button(action: sendMessage) {
                    if isProcessing {
                        ProgressView()
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: "paperplane.fill")
                            .font(.title3)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isProcessing)
            }
            .padding()
            
            // Recording Status
            if speechRecognizer.isRecording {
                HStack {
                    Circle()
                        .fill(.red)
                        .frame(width: 8, height: 8)
                        .scaleEffect(speechRecognizer.isRecording ? 1.2 : 1.0)
                        .animation(.easeInOut(duration: 0.6).repeatForever(), value: speechRecognizer.isRecording)
                    
                    Text("Listening...")
                        .font(.caption)
                        .foregroundColor(.red)
                        .fontWeight(.medium)
                }
                .padding(.bottom)
            }
        }
        .background(Color(.systemGray6))
    }
    
    private var projectPickerSheet: some View {
        NavigationView {
            List {
                ForEach(availableProjects) { project in
                    Button {
                        selectedProject = project
                        showingProjectPicker = false
                    } label: {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(project.name.uW)
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                Text(project.status.uW.uppercased())
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            if selectedProject?.id == project.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Select Project")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingProjectPicker = false
                    }
                }
            }
        }
    }
    
    private var statusColor: Color {
        guard let project = selectedProject else { return .gray }
        
        switch project.status.uW.uppercased() {
        case "PENDING": return .orange
        case "GENERATING": return .blue
        case "READY": return .green
        case "DEPLOYED": return .purple
        case "ERROR": return .red
        default: return .gray
        }
    }
    
    private var availableProjects: [Project] {
        projects.items.filter {
            $0.deleter == nil && $0.userId == auth.currentUser?.id
        }.sorted {
            ($0.updatedAt ?? Date.distantPast) > ($1.updatedAt ?? Date.distantPast)
        }
    }
    
    private func loadDefaultProject() {
        if availableProjects.isEmpty {
            selectedProject = nil
        } else {
            selectedProject = availableProjects.first
        }
    }
    
    private func loadConversationForProject(_ project: Project) {
        guard let projectId = project.id else { return }
        
        // Find existing conversation for this project
        let existingConversation = conversations.items.first {
            $0.projectId == projectId && $0.deleter == nil
        }
        
        if let conversation = existingConversation {
            currentConversation = conversation
        } else {
            // Create new conversation
            guard let userId = auth.currentUser?.id else { return }
            let newConversation = ClaudeCodeConversation(
                projectId: projectId,
                userId: userId
            )
            
            SBTableManager.create(newConversation)
            currentConversation = newConversation
        }
        
        // Load messages for this conversation
        if let conversation = currentConversation,
           let conversationId = conversation.id {
            currentMessages = messages.items.filter {
                $0.conversationId == conversationId && $0.deleter == nil
            }.sorted {
                ($0.createdAt ?? Date.distantPast) < ($1.createdAt ?? Date.distantPast)
            }
        }
    }
    
    private func sendMessage() {
        guard !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let userId = auth.currentUser?.id else { 
            print("SendMessage guard failed - messageText: '\(messageText)', userId: \(auth.currentUser?.id.uuidString ?? "nil")")
            return 
        }
        
        // Auto-select first project if none selected
        if selectedProject == nil && !availableProjects.isEmpty {
            selectedProject = availableProjects.first
            print("Auto-selected project: \(selectedProject?.name ?? "nil")")
        }
        
        guard let project = selectedProject,
              let projectId = project.id else {
            print("No project available - showing project picker")
            showingProjectPicker = true
            return
        }
        
        // Ensure we have a conversation
        if currentConversation == nil {
            print("No conversation found, creating new one")
            let newConversation = ClaudeCodeConversation(
                projectId: projectId,
                userId: userId
            )
            SBTableManager.create(newConversation)
            currentConversation = newConversation
        }
        
        guard let conversationId = currentConversation?.id else {
            print("Failed to get conversation ID")
            return
        }
        
        let trimmedMessage = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        isProcessing = true
        
        // Create user message
        let userMessage = ClaudeMessage(
            conversationId: conversationId,
            role: "user",
            content: trimmedMessage,
            userId: userId
        )
        
        // Save user message to Supabase
        SBTableManager.create(userMessage)
        currentMessages.append(userMessage)
        
        // Clear input
        messageText = ""
        speechRecognizer.reset()
        
        // For now, create a mock assistant response
        // TODO: Integrate with actual Claude Code API
        Task {
            // Simulate processing time
            try await Task.sleep(nanoseconds: 1_000_000_000)
            
            await MainActor.run {
                // Create mock assistant message
                let assistantMessage = ClaudeMessage(
                    conversationId: conversationId,
                    role: "assistant",
                    content: "Claude Code response: I understand you want to '\(trimmedMessage)'. This feature will be implemented soon!",
                    userId: userId,
                    inputMethod: nil,
                    deviceType: "ios"
                )
                
                // Save assistant message to Supabase
                SBTableManager.create(assistantMessage)
                currentMessages.append(assistantMessage)
                
                isProcessing = false
            }
        }
    }
    
    private func toggleRecording() {
        if speechRecognizer.isRecording {
            speechRecognizer.stopRecording()
        } else {
            speechRecognizer.startRecording()
        }
    }
    
}
