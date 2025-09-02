//
//  TemplateCategory.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-31.
//

import SwiftUI
import Supabasable
import Naming

struct TemplateCategory:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Named
{
    static let path = "template_categories"
    static let idName = "id"
    static let typeName = "TemplateCategory"
    static let icon = "folder"
    static let color: ModelColor = .purple
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    var key: String?
    var name: String?
    var description: String?
    var icon: String?
    var colorPrimary: String?
    var isActive: Bool?
    var sortOrder: Int?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case key
        case name
        case description
        case icon
        case colorPrimary = "color_primary"
        case isActive = "is_active"
        case sortOrder = "sort_order"
    }
}
