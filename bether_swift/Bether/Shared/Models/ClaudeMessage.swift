//
//  ClaudeMessage.swift
//  Celiador
//
//  Created by Claude on 2025-08-31.
//

import Foundation
import Supabasable

struct ClaudeMessage: SBTable, SBListable {
    static let path = "claude_messages"
    static let idName = "id"
    static let typeName = "ClaudeMessage"
    static let icon = "message"
    static let color: ModelColor = .blue
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    // Claude Message specific fields
    var conversationId: UUID?
    var role: String?
    var content: String?
    
    // Metadata as separate properties (Apple-friendly)
    var inputMethod: String?
    var deviceType: String?
    var voiceConfidence: Double?
    var executionTimeMs: Int?
    var filesModified: [String]?
    var commandsExecuted: [String]?
    var errorMessage: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        case conversationId = "conversation_id"
        case role
        case content
        case inputMethod = "input_method"
        case deviceType = "device_type"
        case voiceConfidence = "voice_confidence"
        case executionTimeMs = "execution_time_ms"
        case filesModified = "files_modified"
        case commandsExecuted = "commands_executed"
        case errorMessage = "error_message"
    }
}

// MARK: - Initialization
extension ClaudeMessage {
    init(conversationId: UUID, role: String, content: String, userId: UUID, inputMethod: String? = nil, deviceType: String? = "ios") {
        self.id = nil
        self.createdAt = Date()
        self.updatedAt = Date()
        self.deletedAt = nil
        self.creator = userId
        self.updater = nil
        self.deleter = nil
        
        self.conversationId = conversationId
        self.role = role
        self.content = content
        self.inputMethod = inputMethod
        self.deviceType = deviceType
        self.voiceConfidence = nil
        self.executionTimeMs = nil
        self.filesModified = nil
        self.commandsExecuted = nil
        self.errorMessage = nil
    }
}