//
//  ClaudeCodeConversation.swift
//  Bether
//
//  Created by Claude on 2025-08-31.
//

import Foundation
import Supabasable

struct ClaudeCodeConversation: SBTable, SBListable {
    static let path = "claude_conversations"
    static let idName = "id"
    static let typeName = "ClaudeCodeConversation"
    static let icon = "brain.head.profile"
    static let color: ModelColor = .purple
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    // Claude Code specific fields
    var projectId: UUID?
    var title: String?
    var status: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case projectId = "project_id"
        case title
        case status
    }
}

// MARK: - Initialization
extension ClaudeCodeConversation {
    init(projectId: UUID, userId: UUID) {
        self.id = nil
        self.createdAt = Date()
        self.updatedAt = Date()
        self.deletedAt = nil
        self.creator = userId
        self.updater = nil
        self.deleter = nil
        
        self.projectId = projectId
        self.title = "Claude Code Session"
        self.status = "active"
    }
}