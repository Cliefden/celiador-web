//
//  UserApiKey.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-09-01.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

struct UserApiKey:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Named
{
    static let path = "user_api_keys"
    static let idName = "id"
    static let typeName = "UserApiKey"
    static let icon = "key"
    static let color: ModelColor = .purple
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    var userId: UUID?
    var providerId: UUID?
    var keyName: String?
    var encryptedKey: String?
    var keyHash: String?
    var keyPrefix: String?
    var isActive: Bool?
    var isValid: Bool?
    var lastValidatedAt: Date?
    var lastUsedAt: Date?
    var monthlyBudgetCents: Int?
    var dailyRequestLimit: Int?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        
        case userId = "user_id"
        case providerId = "provider_id"
        case keyName = "key_name"
        case encryptedKey = "encrypted_key"
        case keyHash = "key_hash"
        case keyPrefix = "key_prefix"
        case isActive = "is_active"
        case isValid = "is_valid"
        case lastValidatedAt = "last_validated_at"
        case lastUsedAt = "last_used_at"
        case monthlyBudgetCents = "monthly_budget_cents"
        case dailyRequestLimit = "daily_request_limit"
    }
    
    var name: String? { keyName }
}
