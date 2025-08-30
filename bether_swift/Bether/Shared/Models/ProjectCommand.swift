//
//  ProjectCommand.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import Foundation
import SwiftUI
import Supabasable

struct ProjectCommand:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable
{
    
    static let path = "project_commands"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "ProjectCommand"
    static let icon = "text.bubble"
    static let color: ModelColor = .blue
    
    var id: UUID?
    var createdAt: Date?
    var creator: UUID?
    var updater: UUID?
    var updatedAt: Date?
    var deleter: UUID?
    var deletedAt: Date?
    
    var projectId: UUID?
    var commandText: String?
    var commandType: String? // "text", "voice", "generated"
    var status: String? // "pending", "processing", "completed", "failed"
    var response: String?
    var executedAt: Date?
    
    init(
        id: UUID? = nil,
        createdAt: Date? = nil,
        creator: UUID? = nil,
        updater: UUID? = nil,
        updatedAt: Date? = nil,
        deleter: UUID? = nil,
        deletedAt: Date? = nil,
        projectId: UUID? = nil,
        commandText: String? = nil,
        commandType: String? = "text",
        status: String? = "pending",
        response: String? = nil,
        executedAt: Date? = nil
    ) {
        self.id = id
        self.createdAt = createdAt
        self.creator = creator
        self.updater = updater
        self.updatedAt = updatedAt
        self.deleter = deleter
        self.deletedAt = deletedAt
        self.projectId = projectId
        self.commandText = commandText
        self.commandType = commandType
        self.status = status
        self.response = response
        self.executedAt = executedAt
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case creator
        case updater
        case updatedAt = "updated_at"
        case deleter
        case deletedAt = "deleted_at"
        case projectId = "project_id"
        case commandType = "command_type"
        case status
        case response
        case executedAt = "executed_at"
        case commandText = "command_text"
    }
}
