//
//  UserManagementStats.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI

struct UserManagementStats: View {
    let userActivities: [UserActivity]
    
    var body: some View {
        if !userActivities.isEmpty {
            HStack(spacing: 20) {
                UserStatCard(
                    title: "Total Users",
                    value: "\(userActivities.count)",
                    subtitle: "\(activeUsersCount) active",
                    color: .blue
                )
                
                UserStatCard(
                    title: "New Users",
                    value: "\(newUsersCount)",
                    subtitle: "last 30 days",
                    color: .green
                )
                
                UserStatCard(
                    title: "High Volume",
                    value: "\(highVolumeUsersCount)",
                    subtitle: "power users",
                    color: .orange
                )
                
                UserStatCard(
                    title: "Avg Activity",
                    value: "\(averageActivityScore)",
                    subtitle: "activity score",
                    color: .purple
                )
            }
        }
    }
    
    private var activeUsersCount: Int {
        userActivities.filter(\.isActiveUser).count
    }
    
    private var newUsersCount: Int {
        userActivities.filter(\.isRecentUser).count
    }
    
    private var highVolumeUsersCount: Int {
        userActivities.filter(\.isHighVolumeUser).count
    }
    
    private var averageActivityScore: Int {
        guard !userActivities.isEmpty else { return 0 }
        let total = userActivities.map(\.activityScore).reduce(0, +)
        return Int(total / Double(userActivities.count))
    }
}