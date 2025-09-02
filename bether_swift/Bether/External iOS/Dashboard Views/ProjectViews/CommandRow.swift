//
//  CommandRow.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct CommandRow: View {
    let command: ProjectCommand
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(command.commandText ?? "")
                    .font(.body)
                    .foregroundColor(.primary)
                
                Spacer()
                
                StatusBadge(status: command.status ?? "pending")
            }
            
            HStack {
                Text(command.createdAt?.formatted(date: .abbreviated, time: .shortened) ?? "")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if let response = command.response, !response.isEmpty {
                    Text("Has response")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
            
            if let response = command.response, !response.isEmpty {
                Text(response)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}
