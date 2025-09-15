//
//  UserManagementList.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI

struct UserManagementList: View {
    let filteredActivities: [UserActivity]
    let isLoadingActivities: Bool
    let searchText: String
    
    var body: some View {
        Group {
            if isLoadingActivities {
                VStack {
                    Spacer()
                    ProgressView("Loading user activities...")
                    Spacer()
                }
            } else if filteredActivities.isEmpty && !searchText.isEmpty {
                EmptySearchView()
            } else if filteredActivities.isEmpty {
                EmptyUsersView()
            } else {
                UserScrollView(filteredActivities: filteredActivities)
            }
        }
    }
}

struct EmptySearchView: View {
    var body: some View {
        VStack {
            Spacer()
            Image(systemName: "person.crop.circle.badge.questionmark")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("No users found")
                .font(.headline)
            Text("Try adjusting your search or filter criteria")
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer()
        }
    }
}

struct EmptyUsersView: View {
    var body: some View {
        VStack {
            Spacer()
            Image(systemName: "person.3")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("No users available")
                .font(.headline)
            Text("Users will appear here once data is loaded")
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer()
        }
    }
}

struct UserScrollView: View {
    let filteredActivities: [UserActivity]
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(filteredActivities, id: \.id) { userActivity in
                    UserActivityCard(userActivity: userActivity)
                }
            }
            .padding()
        }
    }
}