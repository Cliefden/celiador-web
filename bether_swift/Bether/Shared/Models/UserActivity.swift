//
//  UserActivity.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import Foundation
import SwiftUI
import Supabasable

/// Comprehensive user activity data for management dashboard
struct UserActivity: Identifiable, Hashable {
    let id = UUID()
    
    // Core user info (from Profile)
    var profile: Profile
    
    // Activity metrics
    var totalProjects: Int = 0
    var activeProjects: Int = 0
    var totalConversations: Int = 0
    var activeConversations: Int = 0
    var totalJobs: Int = 0
    var recentJobs: Int = 0
    var totalMessages: Int = 0
    
    // Recent activity
    var lastActiveDate: Date?
    var lastProjectCreated: Date?
    var lastConversationStarted: Date?
    var lastJobRun: Date?
    
    // Usage patterns
    var averageJobsPerDay: Double = 0
    var averageMessagesPerConversation: Double = 0
    var preferredTemplates: [String] = []
    var mostActiveTimeOfDay: String = ""
    
    // Status indicators
    var isHighVolumeUser: Bool { totalJobs > 100 || totalProjects > 20 }
    var isRecentUser: Bool {
        guard let created = profile.createdAt else { return false }
        return Calendar.current.dateInterval(of: .month, for: Date())?.contains(created) ?? false
    }
    var isActiveUser: Bool {
        guard let lastActive = lastActiveDate else { return false }
        return Calendar.current.dateInterval(of: .weekOfYear, for: Date())?.contains(lastActive) ?? false
    }
    
    var activityScore: Double {
        let projectScore = Double(totalProjects) * 2.0
        let conversationScore = Double(totalConversations) * 1.5
        let jobScore = Double(totalJobs) * 1.0
        let messageScore = Double(totalMessages) * 0.1
        
        return projectScore + conversationScore + jobScore + messageScore
    }
}

/// User activity status for quick filtering
enum UserActivityStatus: String, CaseIterable {
    case all = "All Users"
    case active = "Active (7 days)"
    case recent = "New (30 days)"
    case highVolume = "High Volume"
    case inactive = "Inactive"
    
    var color: Color {
        switch self {
        case .all: return .primary
        case .active: return .green
        case .recent: return .blue
        case .highVolume: return .orange
        case .inactive: return .gray
        }
    }
    
    var icon: String {
        switch self {
        case .all: return "person.3"
        case .active: return "person.crop.circle.fill"
        case .recent: return "person.crop.circle.badge.plus"
        case .highVolume: return "person.crop.circle.badge.exclamationmark"
        case .inactive: return "person.crop.circle.badge.minus"
        }
    }
}