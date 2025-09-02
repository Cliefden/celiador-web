//
//  Template.swift
//  Bether
//
//  Created by Claude on 2025-08-31.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

struct Template:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Named
{
    static let path = "templates"
    static let idName = "id"
    static let typeName = "Template"
    static let icon = "square.grid.2x2"
    static let color: ModelColor = .blue
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    // Template specific fields
    var templateKey: String?
    var name: String?
    var description: String?
    var longDescription: String?
    var difficulty: String?
    var icon: String?
    var emoji: String?
    var colorPrimary: String?
    var colorSecondary: String?
    var rating: Double?
    var version: String?
    var storagePath: String?
    var sortOrder: Int?
    var isActive: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case templateKey = "template_key"
        case name
        case description
        case longDescription = "long_description"
        case difficulty
        case icon
        case emoji
        case colorPrimary = "color_primary"
        case colorSecondary = "color_secondary"
        case rating
        case version
        case storagePath = "storage_path"
        case sortOrder = "sort_order"
        case isActive = "is_active"
    }
}

// MARK: - Helper Extensions
extension Template {
    var difficultyEnum: TemplateDifficulty {
        switch difficulty {
        case "beginner": return .beginner
        case "intermediate": return .intermediate
        case "advanced": return .advanced
        default: return .beginner
        }
    }
    
    var primaryColor: Color {
        if let colorPrimary = colorPrimary {
            return Color(hex: colorPrimary) ?? .blue
        }
        return .blue
    }
    
    var secondaryColor: Color? {
        if let colorSecondary = colorSecondary {
            return Color(hex: colorSecondary)
        }
        return nil
    }
}

extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
