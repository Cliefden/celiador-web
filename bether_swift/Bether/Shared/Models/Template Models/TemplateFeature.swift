//
//  TemplateFeature.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-31.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

struct TemplateFeature:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Named
{
    static let path = "template_features"
    static let idName = "id"
    static let typeName = "TemplateFeature"
    static let icon = "star"
    static let color: ModelColor = .yellow
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    var name: String?
    var description: String?
    var icon: String?
    var category: String?
    var isActive: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case name
        case description
        case icon
        case category
        case isActive = "is_active"
    }
}
