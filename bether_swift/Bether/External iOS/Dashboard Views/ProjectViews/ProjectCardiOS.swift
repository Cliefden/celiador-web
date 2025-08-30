//
//  ProjectCard.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI
import OptionalHelpers

struct ProjectCard_iOS: View {
    let project: Project
    
    @State private var template = ProjectTemplate.aiChatApp
    @State private var status: ProjectStatus = .ready
    
    var body: some View {
        HStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 12)
                .fill(template.color.opacity(0.1))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: template.icon)
                        .font(.title2)
                        .foregroundColor(template.color)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(project.name.uW)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Text(project.status.uW)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(status.color.opacity(0.1))
                        .foregroundColor(status.color)
                        .cornerRadius(6)
                }
                
                Text(project.templateKey.uW)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text("Updated \(project.updatedAt.uW, formatter: relativeDateFormatter)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Navigation indicator
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        .buttonStyle(PlainButtonStyle())
        .onAppear {
            template = ProjectTemplate.allCases.first(where: { $0.rawValue == project.templateKey }) ?? .aiChatApp
            
            status = ProjectStatus.allCases.first(where: { $0.rawValue == project.status }) ?? .ready
        }
    }
}

private let relativeDateFormatter: RelativeDateTimeFormatter = {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .short
    return formatter
}()
