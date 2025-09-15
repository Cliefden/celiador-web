//
//  UserActivityCard.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct UserActivityCard: View {
    let userActivity: UserActivity
    @State private var showDetailSheet = false
    @State private var showEditSheet = false
    
    var body: some View {
        CardView(item: userActivity.profile) {
            VStack(spacing: 12) {
                // Activity Overview
                HStack {
                    UserStatCard(
                        title: "Projects",
                        value: "\(userActivity.totalProjects)",
                        subtitle: "\(userActivity.activeProjects) active",
                        color: .blue
                    )
                    
                    UserStatCard(
                        title: "Conversations",
                        value: "\(userActivity.totalConversations)",
                        subtitle: "\(userActivity.activeConversations) active",
                        color: .green
                    )
                    
                    UserStatCard(
                        title: "Jobs",
                        value: "\(userActivity.totalJobs)",
                        subtitle: "\(userActivity.recentJobs) recent",
                        color: .orange
                    )
                }
                
                // Quick metrics
                HStack {
                    Label("\(userActivity.totalMessages) messages", systemImage: "message.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    if userActivity.isHighVolumeUser {
                        Label("High Volume", systemImage: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                    
                    if userActivity.isRecentUser {
                        Label("New User", systemImage: "sparkles")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                    
                    if userActivity.isActiveUser {
                        Label("Active", systemImage: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
            }
            .padding(.vertical, 8)
        } leftSide: {
            CardLeftView(
                headerText: "User",
                mainText: .init(text: userActivity.profile.uWName),
                secondText: .init(text: userActivity.profile.fullName.uW),
                thirdText: .init(text: userActivity.profile.username.uW, color: .blue),
                fourthText: .init(text: userActivity.profile.email.uW, color: .green),
                fifthText: .init(text: userActivity.profile.role?.rawValue ?? "User", color: .purple),
                sixthText: .init(
                    text: "Activity Score: \(Int(userActivity.activityScore))",
                    color: activityScoreColor
                ),
                seventhText: .init(
                    text: "Last Active: \(userActivity.lastActiveDate?.formatted(date: .abbreviated, time: .omitted) ?? "Never")",
                    color: .orange
                ),
                eighthText: .init(
                    text: "Joined: \(userActivity.profile.createdAt?.formatted(date: .abbreviated, time: .omitted) ?? "Unknown")",
                    color: .gray
                )
            )
        } rightSide: {
            CardRightView(
                timeStamp: userActivity.profile.updatedAt,
                creator: userActivity.profile.creator,
                firstButton: .init(
                    text: "View Details",
                    function: { showDetailSheet.toggle() }
                ),
                secondButton: .init(
                    text: "Edit Profile",
                    function: { showEditSheet.toggle() }
                ),
                thirdButton: .init(
                    text: "View Projects",
                    function: { /* TODO: Navigate to user's projects */ }
                )
            )
        }
        .sheet(isPresented: $showDetailSheet) {
            UserActivityDetailSheet(userActivity: userActivity)
        }
        .sheet(isPresented: $showEditSheet) {
            UserProfileEditSheet(profile: userActivity.profile)
        }
    }
    
    private var activityScoreColor: Color {
        switch userActivity.activityScore {
        case 0..<50: return .red
        case 50..<150: return .orange
        case 150..<300: return .yellow
        case 300..<500: return .green
        default: return .blue
        }
    }
}

struct UserActivityDetailSheet: View {
    let userActivity: UserActivity
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with title and close button
            HStack {
                Text("User Activity Details")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("Done") {
                    dismiss()
                }
                .keyboardShortcut(.cancelAction)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // Content
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // User Info Section
                    GroupBox("User Information") {
                        VStack(alignment: .leading, spacing: 8) {
                            InfoRow(title: "Name", value: userActivity.profile.fullName.uW)
                            InfoRow(title: "Username", value: userActivity.profile.username.uW)
                            InfoRow(title: "Email", value: userActivity.profile.email.uW)
                            InfoRow(title: "Role", value: userActivity.profile.role?.rawValue ?? "User")
                            InfoRow(title: "Phone", value: userActivity.profile.phoneNumber.uW)
                            InfoRow(title: "Website", value: userActivity.profile.website.uW)
                        }
                    }
                    
                    // Activity Metrics Section
                    GroupBox("Activity Overview") {
                        VStack(alignment: .leading, spacing: 8) {
                            InfoRow(title: "Total Projects", value: "\(userActivity.totalProjects)")
                            InfoRow(title: "Active Projects", value: "\(userActivity.activeProjects)")
                            InfoRow(title: "Total Conversations", value: "\(userActivity.totalConversations)")
                            InfoRow(title: "Active Conversations", value: "\(userActivity.activeConversations)")
                            InfoRow(title: "Total Jobs", value: "\(userActivity.totalJobs)")
                            InfoRow(title: "Recent Jobs (7 days)", value: "\(userActivity.recentJobs)")
                            InfoRow(title: "Total Messages", value: "\(userActivity.totalMessages)")
                            InfoRow(title: "Activity Score", value: "\(Int(userActivity.activityScore))")
                        }
                    }
                    
                    // Usage Patterns Section
                    GroupBox("Usage Patterns") {
                        VStack(alignment: .leading, spacing: 8) {
                            InfoRow(title: "Avg Jobs/Day", value: String(format: "%.1f", userActivity.averageJobsPerDay))
                            InfoRow(title: "Avg Messages/Conversation", value: String(format: "%.1f", userActivity.averageMessagesPerConversation))
                            InfoRow(title: "Most Active Time", value: userActivity.mostActiveTimeOfDay)
                            
                            if !userActivity.preferredTemplates.isEmpty {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Preferred Templates:")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    
                                    ForEach(userActivity.preferredTemplates, id: \.self) { template in
                                        Text("• \(template)")
                                            .font(.caption)
                                            .padding(.leading, 8)
                                    }
                                }
                            }
                        }
                    }
                    
                    // Status Indicators Section
                    GroupBox("Status Indicators") {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: userActivity.isActiveUser ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(userActivity.isActiveUser ? .green : .gray)
                                Text("Active User (last 7 days)")
                            }
                            
                            HStack {
                                Image(systemName: userActivity.isRecentUser ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(userActivity.isRecentUser ? .blue : .gray)
                                Text("New User (last 30 days)")
                            }
                            
                            HStack {
                                Image(systemName: userActivity.isHighVolumeUser ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(userActivity.isHighVolumeUser ? .orange : .gray)
                                Text("High Volume User")
                            }
                        }
                    }
                    
                    // Timeline Section
                    GroupBox("Recent Activity") {
                        VStack(alignment: .leading, spacing: 8) {
                            if let date = userActivity.lastActiveDate {
                                DateInfoRow(title: "Last Active", date: date)
                            }
                            if let date = userActivity.lastProjectCreated {
                                DateInfoRow(title: "Last Project Created", date: date)
                            }
                            if let date = userActivity.lastConversationStarted {
                                DateInfoRow(title: "Last Conversation Started", date: date)
                            }
                            if let date = userActivity.lastJobRun {
                                DateInfoRow(title: "Last Job Run", date: date)
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .frame(minWidth: 600, minHeight: 500)
    }
}

