//
//  ActivityDetailSheet.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct ActivityDetailSheet: View {
    let activity: Activity
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Circle()
                                .fill(activity.type.color.opacity(0.1))
                                .frame(width: 50, height: 50)
                                .overlay(
                                    Image(systemName: activity.type.icon)
                                        .font(.system(size: 24))
                                        .foregroundColor(activity.type.color)
                                )
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(activity.title)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primary)
                                
                                Text(activity.timestamp, formatter: detailTimeFormatter)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                        }
                        
                        Text(activity.status.rawValue)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(activity.status.color.opacity(0.1))
                            .foregroundColor(activity.status.color)
                            .cornerRadius(16)
                    }
                    
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(activity.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    
                    // Logs (if applicable)
                    if activity.type == .jobLog, let logs = activity.logs {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Logs")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            ScrollView {
                                LazyVStack(alignment: .leading, spacing: 4) {
                                    ForEach(logs, id: \.timestamp) { log in
                                        LogEntryView(log: log)
                                    }
                                }
                            }
                            .frame(maxHeight: 300)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Activity Details")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                trailing: Button("Done") { dismiss() }
            )
        }
    }
}

private let detailTimeFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.timeStyle = .short
    return formatter
}()
