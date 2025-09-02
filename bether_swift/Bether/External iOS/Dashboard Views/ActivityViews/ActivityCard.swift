//
//  ActivityCard.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct ActivityCard: View {
    let activity: Activity
    @State private var showingDetails = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Icon
                Circle()
                    .fill(activity.type.color.opacity(0.1))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Image(systemName: activity.type.icon)
                            .font(.system(size: 18))
                            .foregroundColor(activity.type.color)
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(activity.title)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        Text(activity.timestamp, formatter: timeFormatter)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Text(activity.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                    
                    if let projectName = activity.projectName {
                        Text("Project: \(projectName)")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
            }
            
            // Status Badge
            HStack {
                Spacer()
                
                Text(activity.status.rawValue)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(activity.status.color.opacity(0.1))
                    .foregroundColor(activity.status.color)
                    .cornerRadius(12)
            }
            
            // Action Buttons
            if activity.type == .jobLog {
                HStack {
                    Button("View Logs") {
                        showingDetails = true
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                    
                    Spacer()
                    
                    if activity.status == .running {
                        ProgressView()
                            .scaleEffect(0.7)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        .sheet(isPresented: $showingDetails) {
            ActivityDetailSheet(activity: activity)
        }
    }
}

private let timeFormatter: RelativeDateTimeFormatter = {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .short
    return formatter
}()
