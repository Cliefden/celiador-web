//
//  UserManagementView.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI
import Supabasable
import Naming
import OptionalHelpers

struct UserManagementView: View {
    @State private var profiles = SBTableViewModel<Profile>()
    @State private var projects = SBTableViewModel<Project>()
    @State private var conversations = SBTableViewModel<Conversation>()
    @State private var jobs = SBTableViewModel<Job>()
    @State private var messages = SBTableViewModel<Message>()
    
    @State private var userActivities: [UserActivity] = []
    @State private var filteredActivities: [UserActivity] = []
    @State private var selectedStatus: UserActivityStatus = .all
    @State private var searchText: String = ""
    @State private var isLoadingActivities = false
    @State private var sortOption: SortOption = .activityScore
    @State private var sortAscending = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header and Controls
            VStack(spacing: 16) {
                UserManagementHeader(
                    totalUsers: userActivities.count,
                    filteredUsers: filteredActivities.count,
                    onRefresh: loadUserActivities,
                    isLoading: isLoadingActivities
                )
                
                UserManagementControls(
                    searchText: $searchText,
                    selectedStatus: $selectedStatus,
                    sortOption: $sortOption,
                    sortAscending: $sortAscending
                )
                
                UserManagementStats(userActivities: userActivities)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // User List
            UserManagementList(
                filteredActivities: filteredActivities,
                isLoadingActivities: isLoadingActivities,
                searchText: searchText
            )
        }
        .onFirstAppear {
            startDataListeners()
        }
        .onDisappear {
            stopDataListeners()
        }
        .onChange(of: searchText) { _, _ in
            filterUsers()
        }
        .onChange(of: selectedStatus) { _, _ in
            filterUsers()
        }
        .onChange(of: sortOption) { _, _ in
            sortUsers()
        }
        .onChange(of: sortAscending) { _, _ in
            sortUsers()
        }
        .onChange(of: profiles.items) { _, _ in
            loadUserActivities()
        }
        .onChange(of: projects.items) { _, _ in
            updateUserActivities()
        }
        .onChange(of: conversations.items) { _, _ in
            updateUserActivities()
        }
        .onChange(of: jobs.items) { _, _ in
            updateUserActivities()
        }
        .onChange(of: messages.items) { _, _ in
            updateUserActivities()
        }
    }
    
    private func startDataListeners() {
        profiles.addListener()
        projects.addListener()
        conversations.addListener()
        jobs.addListener()
        messages.addListener()
    }
    
    private func stopDataListeners() {
        profiles.cancelListener()
        projects.cancelListener()
        conversations.cancelListener()
        jobs.cancelListener()
        messages.cancelListener()
    }
    
    private func loadUserActivities() {
        guard !profiles.items.isEmpty else { return }
        
        isLoadingActivities = true
        
        Task {
            await MainActor.run {
                updateUserActivities()
                isLoadingActivities = false
            }
        }
    }
    
    private func updateUserActivities() {
        let newActivities = profiles.items.map { profile in
            calculateUserActivity(for: profile)
        }
        
        userActivities = newActivities
        filterUsers()
    }
    
    private func calculateUserActivity(for profile: Profile) -> UserActivity {
        let userProjects = projects.items.filter { $0.userId == profile.id }
        let userConversations = conversations.items.filter { $0.userId == profile.id }
        let userJobs = jobs.items.filter { $0.userId == profile.id }
        let userMessages = messages.items.filter { message in
            userConversations.contains { $0.id == message.conversationId }
        }
        
        // Calculate date-based metrics
        let now = Date()
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: now) ?? now
        
        let recentJobs = userJobs.filter { job in
            guard let createdAt = job.createdAt else { return false }
            return createdAt >= weekAgo
        }.count
        
        let activeProjects = userProjects.filter { project in
            project.status != "completed" && project.status != "archived" && project.deletedAt == nil
        }.count
        
        let activeConversations = userConversations.filter { conversation in
            conversation.status != "completed" && conversation.status != "archived" && conversation.deletedAt == nil
        }.count
        
        // Find last activity dates
        let lastProjectDate = userProjects.compactMap(\.createdAt).max()
        let lastConversationDate = userConversations.compactMap(\.createdAt).max()
        let lastJobDate = userJobs.compactMap(\.createdAt).max()
        let lastActiveDate = [lastProjectDate, lastConversationDate, lastJobDate].compactMap { $0 }.max()
        
        // Calculate usage patterns
        let daysSinceCreated = profile.createdAt?.timeIntervalSinceNow.magnitude ?? 1
        let daysCount = max(1, daysSinceCreated / 86400) // seconds in a day
        let averageJobsPerDay = Double(userJobs.count) / daysCount
        
        let averageMessagesPerConversation = userConversations.isEmpty ? 0.0 : 
            Double(userMessages.count) / Double(userConversations.count)
        
        // Find preferred templates
        let templateCounts = Dictionary(grouping: userProjects.compactMap(\.templateKey)) { $0 }
        let preferredTemplates = templateCounts
            .sorted { $0.value.count > $1.value.count }
            .prefix(3)
            .map(\.key)
        
        return UserActivity(
            profile: profile,
            totalProjects: userProjects.count,
            activeProjects: activeProjects,
            totalConversations: userConversations.count,
            activeConversations: activeConversations,
            totalJobs: userJobs.count,
            recentJobs: recentJobs,
            totalMessages: userMessages.count,
            lastActiveDate: lastActiveDate,
            lastProjectCreated: lastProjectDate,
            lastConversationStarted: lastConversationDate,
            lastJobRun: lastJobDate,
            averageJobsPerDay: averageJobsPerDay,
            averageMessagesPerConversation: averageMessagesPerConversation,
            preferredTemplates: Array(preferredTemplates)
        )
    }
    
    private func filterUsers() {
        var filtered = userActivities
        
        // Apply status filter
        switch selectedStatus {
        case .all:
            break
        case .active:
            filtered = filtered.filter(\.isActiveUser)
        case .recent:
            filtered = filtered.filter(\.isRecentUser)
        case .highVolume:
            filtered = filtered.filter(\.isHighVolumeUser)
        case .inactive:
            filtered = filtered.filter { !$0.isActiveUser }
        }
        
        // Apply search filter
        if !searchText.isEmpty {
            filtered = filtered.filter { activity in
                let profile = activity.profile
                let searchLower = searchText.lowercased()
                
                return profile.uWName.lowercased().contains(searchLower) ||
                       profile.fullName?.lowercased().contains(searchLower) == true ||
                       profile.username?.lowercased().contains(searchLower) == true ||
                       profile.email?.lowercased().contains(searchLower) == true
            }
        }
        
        filteredActivities = filtered
        sortUsers()
    }
    
    private func sortUsers() {
        filteredActivities.sort { lhs, rhs in
            let result: Bool
            
            switch sortOption {
            case .name:
                result = lhs.profile.uWName.lowercased() < rhs.profile.uWName.lowercased()
            case .activityScore:
                result = lhs.activityScore < rhs.activityScore
            case .totalProjects:
                result = lhs.totalProjects < rhs.totalProjects
            case .totalJobs:
                result = lhs.totalJobs < rhs.totalJobs
            case .lastActive:
                let lhsDate = lhs.lastActiveDate ?? Date.distantPast
                let rhsDate = rhs.lastActiveDate ?? Date.distantPast
                result = lhsDate < rhsDate
            case .joinDate:
                let lhsDate = lhs.profile.createdAt ?? Date.distantPast
                let rhsDate = rhs.profile.createdAt ?? Date.distantPast
                result = lhsDate < rhsDate
            }
            
            return sortAscending ? result : !result
        }
    }
}

#Preview {
    UserManagementView()
        .frame(minWidth: 800, minHeight: 600)
}