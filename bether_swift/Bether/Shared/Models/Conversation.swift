//
//  Conversation.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

typealias conversationID = reference

struct Conversation:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Named,
    HasStatus
{
    static let path = "conversations"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "Conversation"
    static let icon = "message.circle"
    static let color: ModelColor = .green
    
    var id: reference?
    var createdAt: Date?
    var creator: profileID?
    var updater: profileID?
    var updatedAt: Date?
    var deleter: profileID?
    var deletedAt: Date?
    
    var title: String?
    var status: String?
    var projectId: reference?
    var userId: reference?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "createdat"
        case creator
        case updater
        case updatedAt = "updatedat"
        case deleter
        case deletedAt = "deletedat"
        
        case title
        case status
        case projectId = "projectid"
        case userId = "userid"
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Conversation, rhs: Conversation) -> Bool {
        return lhs.id == rhs.id
    }
    
    var name: String? {
        return title
    }
}
