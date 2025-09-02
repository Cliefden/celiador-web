//
//  QuickActionChip.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-31.
//

import SwiftUI

struct QuickActionChip: View {
    let title: String
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.purple.opacity(0.1))
            .foregroundColor(.purple)
            .cornerRadius(16)
        }
    }
}
