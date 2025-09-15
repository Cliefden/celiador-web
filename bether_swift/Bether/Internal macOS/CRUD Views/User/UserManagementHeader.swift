//
//  UserManagementHeader.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI

struct UserManagementHeader: View {
    let totalUsers: Int
    let filteredUsers: Int
    let onRefresh: () -> Void
    let isLoading: Bool
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("User Management Dashboard")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("\(totalUsers) users • \(filteredUsers) showing")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: onRefresh) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                    Text("Refresh")
                }
            }
            .disabled(isLoading)
        }
    }
}