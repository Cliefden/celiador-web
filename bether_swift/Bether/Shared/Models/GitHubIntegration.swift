//
//  GitHubIntegration.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

typealias gitHubIntegrationID = reference

struct GitHubIntegration:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Hashable,
    Named
{
    static let path = "github_integrations"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "GitHubIntegration"
    static let icon = "link.circle"
    static let color: ModelColor = .orange
    
    var id: reference?
    var createdAt: Date?
    var creator: profileID?
    var updater: profileID?
    var updatedAt: Date?
    var deleter: profileID?
    var deletedAt: Date?
    
    var accessToken: String?
    var refreshToken: String?
    var scope: [String]?
    var installationId: String?
    var userId: reference?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "createdat"
        case creator
        case updater
        case updatedAt = "updatedat"
        case deleter
        case deletedAt = "deletedat"
        
        case accessToken = "accesstoken"
        case refreshToken = "refreshtoken"
        case scope
        case installationId = "installationid"
        case userId = "userid"
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: GitHubIntegration, rhs: GitHubIntegration) -> Bool {
        return lhs.id == rhs.id
    }
    
    var name: String? {
        return "GitHub Integration"
    }
}
