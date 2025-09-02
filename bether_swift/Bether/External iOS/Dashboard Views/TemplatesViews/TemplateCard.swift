//
//  TemplateCard.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI
import OptionalHelpers

struct TemplateCard: View {
    let template: Template
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                // Template Image/Icon
                RoundedRectangle(cornerRadius: 8)
                    .fill(
                        LinearGradient(
                            colors: [template.primaryColor, template.secondaryColor ?? template.primaryColor],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(height: 120)
                    .overlay(
                        VStack {
                            Image(systemName: template.icon.uW)
                                .font(.system(size: 32))
                                .foregroundColor(.white)
                            
                            Text(template.emoji.uW)
                                .font(.title)
                        }
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(template.name.uW)
                        .font(.headline)
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    
                    Text(template.description.uW)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                    
                    HStack {
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .font(.caption2)
                                .foregroundColor(.yellow)
                            Text("\(template.rating ?? 0.0, specifier: "%.1f")")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        Text(template.difficultyEnum.displayName)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(template.difficultyEnum.color.opacity(0.1))
                            .foregroundColor(template.difficultyEnum.color)
                            .cornerRadius(4)
                    }
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}
