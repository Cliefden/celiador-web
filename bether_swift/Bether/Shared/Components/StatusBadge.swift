//
//  StatusBadge.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct StatusBadge: View {
    let status: String
    
    var body: some View {
        Text(status.uppercased())
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.1))
            .foregroundColor(statusColor)
            .cornerRadius(6)
    }
    
    private var statusColor: Color {
        switch status.lowercased() {
        case "pending": return .orange
        case "processing": return .blue
        case "completed": return .green
        case "failed": return .red
        default: return .gray
        }
    }
}
