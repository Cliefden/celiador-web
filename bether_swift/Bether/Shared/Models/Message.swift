//
//  Message.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

typealias messageID = reference

/// Structured metadata for message context
struct MessageMetadata: Codable, Hashable {
    // Message context
    var tokens: Int?
    var model: String?
    var temperature: Double?
    var fileReferences: [String]?
    var jobResults: [String]?
    
    // Custom properties (for future extensibility)
    var custom: [String: String]?
}

struct Message:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Hashable,
    Named
{
    static let path = "messages"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "Message"
    static let icon = "text.bubble"
    static let color: ModelColor = .purple
    
    var id: reference?
    var createdAt: Date?
    var creator: profileID?
    var updater: profileID?
    var updatedAt: Date?
    var deleter: profileID?
    var deletedAt: Date?
    
    var content: String?
    var role: String?
    var messageType: String?
    var metadata: MessageMetadata?
    var parentId: reference?
    var relatedJobId: reference?
    var conversationId: reference?
    var userId: reference?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "createdat"
        case creator
        case updater
        case updatedAt = "updatedat"
        case deleter
        case deletedAt = "deletedat"
        
        case content
        case role
        case messageType = "messagetype"
        case metadata
        case parentId = "parentid"
        case relatedJobId = "relatedjobid"
        case conversationId = "conversationid"
        case userId = "userid"
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Message, rhs: Message) -> Bool {
        return lhs.id == rhs.id
    }
    
    var name: String? {
        return content?.prefix(50).description
    }
}
