//
//  UserStatCard.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import SwiftUI

struct UserStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(color.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(color.opacity(0.2), lineWidth: 1)
                )
        )
        .frame(minWidth: 80)
    }
}

#Preview {
    HStack(spacing: 12) {
        UserStatCard(
            title: "Projects",
            value: "42",
            subtitle: "12 active",
            color: .blue
        )
        
        UserStatCard(
            title: "Conversations",
            value: "18",
            subtitle: "3 active",
            color: .green
        )
        
        UserStatCard(
            title: "Jobs",
            value: "156",
            subtitle: "8 recent",
            color: .orange
        )
        
        UserStatCard(
            title: "Total Users",
            value: "248",
            subtitle: "42 active",
            color: .purple
        )
    }
    .padding()
}