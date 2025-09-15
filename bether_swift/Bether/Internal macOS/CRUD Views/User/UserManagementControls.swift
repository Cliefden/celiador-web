//
//  UserManagementControls.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI

struct UserManagementControls: View {
    @Binding var searchText: String
    @Binding var selectedStatus: UserActivityStatus
    @Binding var sortOption: SortOption
    @Binding var sortAscending: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                
                TextField("Search users by name, email, or username...", text: $searchText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Filter and Sort Controls
            HStack {
                // Status Filter
                Picker("Filter", selection: $selectedStatus) {
                    ForEach(UserActivityStatus.allCases, id: \.self) { status in
                        HStack {
                            Image(systemName: status.icon)
                            Text(status.rawValue)
                        }
                        .tag(status)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .frame(width: 150)
                
                Spacer()
                
                // Sort Options
                HStack {
                    Text("Sort by:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Picker("Sort", selection: $sortOption) {
                        ForEach(SortOption.allCases, id: \.self) { option in
                            Text(option.rawValue).tag(option)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .frame(width: 120)
                    
                    Button(action: { sortAscending.toggle() }) {
                        Image(systemName: sortAscending ? "arrow.up" : "arrow.down")
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
}