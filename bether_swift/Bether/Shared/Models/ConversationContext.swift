//
//  ConversationContext.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

typealias conversationContextID = reference

/// Structured context data for AI conversations
struct ContextData: Codable, Hashable {
    // Context types
    var projectSummary: String?
    var fileKnowledge: [String: String]?
    var userPreferences: [String: String]?
    var vectorEmbeddings: [String: [Double]]?
    
    // Custom properties (for future extensibility)
    var custom: [String: String]?
}

struct ConversationContext:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Hashable,
    Named
{
    static let path = "conversation_contexts"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "ConversationContext"
    static let icon = "brain.head.profile"
    static let color: ModelColor = .indigo
    
    var id: reference?
    var createdAt: Date?
    var creator: profileID?
    var updater: profileID?
    var updatedAt: Date?
    var deleter: profileID?
    var deletedAt: Date?
    
    var contextType: String?
    var contextData: ContextData?
    var lastUpdated: Date?
    var conversationId: reference?
    var projectId: reference?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "createdat"
        case creator
        case updater
        case updatedAt = "updatedat"
        case deleter
        case deletedAt = "deletedat"
        
        case contextType = "contexttype"
        case contextData = "contextdata"
        case lastUpdated = "lastupdated"
        case conversationId = "conversationid"
        case projectId = "projectid"
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: ConversationContext, rhs: ConversationContext) -> Bool {
        return lhs.id == rhs.id
    }
    
    var name: String? {
        return contextType
    }
}
