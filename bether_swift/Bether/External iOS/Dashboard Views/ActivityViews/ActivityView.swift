//
//  ActivityView.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-29.
//

import SwiftUI

struct ActivityView: View {
    @State private var selectedFilter: ActivityFilter = .all
    @State private var activities = sampleActivities
    
    var filteredActivities: [Activity] {
        if selectedFilter == .all {
            return activities
        }
        return activities.filter { $0.type == selectedFilter.activityType }
    }
    
    var body: some View {
            VStack(spacing: 0) {
                // Filter Tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(ActivityFilter.allCases, id: \.self) { filter in
                            FilterChip(
                                filter: filter,
                                isSelected: selectedFilter == filter
                            ) {
                                selectedFilter = filter
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
                
                if filteredActivities.isEmpty {
                    // Empty State
                    VStack(spacing: 24) {
                        Image(systemName: "clock")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary.opacity(0.6))
                        
                        VStack(spacing: 12) {
                            Text("No Recent Activity")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                            
                            Text("Your project activity and job logs will appear here.")
                                .font(.body)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else {
                    // Activities List
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredActivities) { activity in
                                ActivityCard(activity: activity)
                            }
                        }
                        .padding()
                    }
                }
            }
            .toolbar {
                ToolbarItem {
                    Button {
                        // Refresh activities
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
}




// MARK: - Data Models
struct Activity: Identifiable {
    let id: UUID
    let title: String
    let description: String
    let type: ActivityType
    let status: ActivityStatus
    let timestamp: Date
    let projectName: String?
    let logs: [LogEntry]?
}



struct LogEntry {
    let timestamp: Date
    let level: LogLevel
    let message: String
}

// Sample data
let sampleActivities = [
    Activity(
        id: UUID(),
        title: "Project Created",
        description: "E-commerce Dashboard project has been created successfully",
        type: .projectCreated,
        status: .completed,
        timestamp: Date().addingTimeInterval(-300),
        projectName: "E-commerce Dashboard",
        logs: nil
    ),
    Activity(
        id: UUID(),
        title: "AI Code Generation",
        description: "Generating React components and API endpoints",
        type: .jobLog,
        status: .running,
        timestamp: Date().addingTimeInterval(-180),
        projectName: "AI Chat Assistant",
        logs: [
            LogEntry(timestamp: Date().addingTimeInterval(-180), level: .info, message: "Starting code generation job"),
            LogEntry(timestamp: Date().addingTimeInterval(-170), level: .info, message: "Analyzing project requirements"),
            LogEntry(timestamp: Date().addingTimeInterval(-160), level: .success, message: "Generated 5 React components"),
            LogEntry(timestamp: Date().addingTimeInterval(-150), level: .info, message: "Creating API endpoints..."),
            LogEntry(timestamp: Date().addingTimeInterval(-140), level: .warning, message: "Rate limiting detected, retrying..."),
            LogEntry(timestamp: Date().addingTimeInterval(-130), level: .success, message: "Generated 3 API endpoints")
        ]
    ),
    Activity(
        id: UUID(),
        title: "Deployment Successful",
        description: "Product Landing has been deployed to Vercel",
        type: .deployment,
        status: .completed,
        timestamp: Date().addingTimeInterval(-3600),
        projectName: "Product Landing",
        logs: nil
    ),
    Activity(
        id: UUID(),
        title: "Build Failed",
        description: "TypeScript compilation errors in Task Manager App",
        type: .error,
        status: .failed,
        timestamp: Date().addingTimeInterval(-7200),
        projectName: "Task Manager App",
        logs: [
            LogEntry(timestamp: Date().addingTimeInterval(-7200), level: .info, message: "Starting build process"),
            LogEntry(timestamp: Date().addingTimeInterval(-7190), level: .error, message: "TypeScript error: Property 'id' does not exist on type 'User'"),
            LogEntry(timestamp: Date().addingTimeInterval(-7180), level: .error, message: "Build failed with 3 errors")
        ]
    ),
    Activity(
        id: UUID(),
        title: "Template Applied",
        description: "SaaS Starter Kit template applied to new project",
        type: .projectCreated,
        status: .completed,
        timestamp: Date().addingTimeInterval(-10800),
        projectName: "My SaaS App",
        logs: nil
    )
]

#Preview {
    ActivityView()
}
