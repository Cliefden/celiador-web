//
//  Project.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

/// Structured metadata for project configuration
struct ProjectMetadata: Codable, Hashable {
    // Environment Variables
    var environmentVariables: [String: String]?
    
    // Build Configuration
    var buildConfig: [String: String]?
    
    // Deployment Settings
    var deploymentSettings: [String: String]?
    
    // Custom Configuration
    var custom: [String: String]?
}

typealias projectID = reference

struct Project:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Named,
    HasStatus
{
    
    static let path = "projects"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "Project"
    static let icon = "folder.circle"
    static let color: ModelColor = .blue
    
    var id: reference?
    var createdAt: Date?
    var creator: profileID?
    var updater: profileID?
    var updatedAt: Date?
    var deleter: profileID?
    var deletedAt: Date?
    
    var name: String?
    var templateKey: String?
    var status: String?
    var repoProvider: String?
    var repoOwner: String?
    var repoName: String?
    var env: ProjectMetadata?
    var userId: reference?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "createdat"
        case creator
        case updater
        case updatedAt = "updatedat"
        case deleter
        case deletedAt = "deletedat"
        
        case name
        case templateKey = "templatekey"
        case status
        case repoProvider = "repoprovider"
        case repoOwner = "repoowner"
        case repoName = "reponame"
        case env
        case userId = "userid"
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Project, rhs: Project) -> Bool {
        return lhs.id == rhs.id
    }
}
