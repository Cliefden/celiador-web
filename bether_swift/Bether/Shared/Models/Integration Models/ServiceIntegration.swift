//
//  ServiceIntegration.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

typealias serviceIntegrationID = reference

/// Service-specific configuration
struct ServiceConfig: Codable, Hashable {
    var apiKey: String?
    var endpoint: String?
    var model: String?
    var settings: [String: String]?
    
    // Custom properties (for future extensibility)
    var custom: [String: String]?
}

struct ServiceIntegration:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Hashable,
    Named,
    HasStatus
{
    static let path = "service_integrations"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "ServiceIntegration"
    static let icon = "server.rack"
    static let color: ModelColor = .brown
    
    var id: reference?
    var createdAt: Date?
    var creator: profileID?
    var updater: profileID?
    var updatedAt: Date?
    var deleter: profileID?
    var deletedAt: Date?
    
    var service: String?
    var config: ServiceConfig?
    var status: String?
    var lastSync: Date?
    var userId: reference?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "createdat"
        case creator
        case updater
        case updatedAt = "updatedat"
        case deleter
        case deletedAt = "deletedat"
        
        case service
        case config
        case status
        case lastSync = "lastsync"
        case userId = "userid"
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: ServiceIntegration, rhs: ServiceIntegration) -> Bool {
        return lhs.id == rhs.id
    }
    
    var name: String? {
        return service
    }
}
