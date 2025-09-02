//
//  Activity Enums.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

enum ActivityType {
    case projectCreated
    case jobLog
    case deployment
    case error
    
    var icon: String {
        switch self {
        case .projectCreated: return "plus.circle"
        case .jobLog: return "gear"
        case .deployment: return "arrow.up.circle"
        case .error: return "exclamationmark.triangle"
        }
    }
    
    var color: Color {
        switch self {
        case .projectCreated: return .green
        case .jobLog: return .blue
        case .deployment: return .purple
        case .error: return .red
        }
    }
}

enum ActivityStatus: String {
    case completed = "Completed"
    case running = "Running"
    case failed = "Failed"
    case pending = "Pending"
    
    var color: Color {
        switch self {
        case .completed: return .green
        case .running: return .blue
        case .failed: return .red
        case .pending: return .orange
        }
    }
}

enum ActivityFilter: CaseIterable {
    case all
    case projects
    case jobs
    case deployments
    case errors
    
    var displayName: String {
        switch self {
        case .all: return "All"
        case .projects: return "Projects"
        case .jobs: return "Jobs"
        case .deployments: return "Deployments"
        case .errors: return "Errors"
        }
    }
    
    var icon: String {
        switch self {
        case .all: return "square.grid.2x2"
        case .projects: return "folder"
        case .jobs: return "gear"
        case .deployments: return "arrow.up.circle"
        case .errors: return "exclamationmark.triangle"
        }
    }
    
    var activityType: ActivityType? {
        switch self {
        case .all: return nil
        case .projects: return .projectCreated
        case .jobs: return .jobLog
        case .deployments: return .deployment
        case .errors: return .error
        }
    }
}

enum LogLevel {
    case info
    case warning
    case error
    case success
    
    var color: Color {
        switch self {
        case .info: return .primary
        case .warning: return .orange
        case .error: return .red
        case .success: return .green
        }
    }
}
