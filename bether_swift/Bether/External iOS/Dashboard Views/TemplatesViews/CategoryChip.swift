//
//  CategoryChip.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI
import OptionalHelpers

struct CategoryChip: View {
    let category: TemplateCategory
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: category.icon.uW)
                Text(category.name.uW)
            }
            .font(.subheadline)
            .fontWeight(isSelected ? .semibold : .regular)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? category.primaryColor : Color(.systemGray6))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

extension TemplateCategory {
    var primaryColor: Color {
        if let colorPrimary = colorPrimary {
            return Color(hex: colorPrimary) ?? .blue
        }
        return .blue
    }
}
