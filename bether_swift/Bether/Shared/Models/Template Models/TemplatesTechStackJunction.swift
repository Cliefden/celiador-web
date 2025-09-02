//
//  TemplatesTechStackJunction.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-31.
//

import Foundation
import SwiftUI
import Supabasable

struct TemplatesTechStackJunction:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable
{
    static let path = "templates_tech_stack"
    static let idName = "id"
    static let typeName = "TemplatesTechStackJunction"
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
    var techId: UUID?
    var isPrimaryTech: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case templateId = "template_id"
        case techId = "tech_id"
        case isPrimaryTech = "is_primary_tech"
    }
}
