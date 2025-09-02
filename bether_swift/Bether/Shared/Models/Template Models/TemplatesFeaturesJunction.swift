//
//  TemplatesFeaturesJunction.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-31.
//

import Foundation
import SwiftUI
import Supabasable

struct TemplatesFeaturesJunction:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable
{
    static let path = "templates_features"
    static let idName = "id"
    static let typeName = "TemplatesFeaturesJunction"
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
    var featureId: UUID?
    var isCoreFeature: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case templateId = "template_id"
        case featureId = "feature_id"
        case isCoreFeature = "is_core_feature"
    }
}
