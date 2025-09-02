//
//  UserUsageLimit.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-09-01.
//

import Foundation
import SwiftUI
import Supabasable

struct UserUsageLimit:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable
{
    static let path = "user_usage_limits"
    static let idName = "id"
    static let typeName = "UserUsageLimit"
    static let icon = "speedometer"
    static let color: ModelColor = .orange
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    var userId: UUID?
    var providerId: UUID?
    var freeTierRequestsLimit: Int?
    var freeTierTokensLimit: Int?
    var currentMonth: String?
    var freeTierRequestsUsed: Int?
    var freeTierTokensUsed: Int?
    var monthlyBudgetCents: Int?
    var dailyBudgetCents: Int?
    var notifyAt80Percent: Bool?
    var notifyAt100Percent: Bool?
    var lastNotificationSent: Date?
    
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
        case freeTierRequestsLimit = "free_tier_requests_limit"
        case freeTierTokensLimit = "free_tier_tokens_limit"
        case currentMonth = "current_month"
        case freeTierRequestsUsed = "free_tier_requests_used"
        case freeTierTokensUsed = "free_tier_tokens_used"
        case monthlyBudgetCents = "monthly_budget_cents"
        case dailyBudgetCents = "daily_budget_cents"
        case notifyAt80Percent = "notify_at_80_percent"
        case notifyAt100Percent = "notify_at_100_percent"
        case lastNotificationSent = "last_notification_sent"
    }
    
    // Helper computed properties
    var freeTierUsagePercentage: Double {
        guard let used = freeTierRequestsUsed,
              let limit = freeTierRequestsLimit,
              limit > 0 else { return 0.0 }
        return Double(used) / Double(limit) * 100.0
    }
    
    var remainingRequests: Int {
        guard let used = freeTierRequestsUsed,
              let limit = freeTierRequestsLimit else { return 0 }
        return max(0, limit - used)
    }
    
    var remainingTokens: Int {
        guard let used = freeTierTokensUsed,
              let limit = freeTierTokensLimit else { return 0 }
        return max(0, limit - used)
    }
}
