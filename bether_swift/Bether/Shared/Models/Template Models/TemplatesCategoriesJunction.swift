//
//  TemplatesCategoriesJunction.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-31.
//

import Foundation
import SwiftUI
import Supabasable

struct TemplatesCategoriesJunction:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable
{
    static let path = "templates_categories"
    static let idName = "id"
    static let typeName = "TemplatesCategoriesJunction"
    static var icon = "link"
    static var color = ModelColor.pink
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    var templateId: UUID?
    var categoryId: UUID?
    var isPrimaryCategory: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case templateId = "template_id"
        case categoryId = "category_id"
        case isPrimaryCategory = "is_primary_category"
    }
}
