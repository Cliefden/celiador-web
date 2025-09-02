//
//  ApiUsage.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-09-01.
//

import Foundation
import SwiftUI
import Supabasable

struct ApiUsage:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable
{
    static let path = "api_usage"
    static let idName = "id"
    static let typeName = "ApiUsage"
    static let icon = "chart.bar"
    static let color: ModelColor = .blue
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    var providerId: UUID?
    var projectId: UUID?
    var userApiKeyId: UUID?
    var operationType: String?
    var modelUsed: String?
    var inputTokens: Int?
    var outputTokens: Int?
    var totalTokens: Int?
    var inputCostCents: Int?
    var outputCostCents: Int?
    var totalCostCents: Int?
    var keySource: String?
    var responseTimeMs: Int?
    var success: Bool?
    var errorMessage: String?
    var date: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        
        case providerId = "provider_id"
        case projectId = "project_id"
        case userApiKeyId = "user_api_key_id"
        case operationType = "operation_type"
        case modelUsed = "model_used"
        case inputTokens = "input_tokens"
        case outputTokens = "output_tokens"
        case totalTokens = "total_tokens"
        case inputCostCents = "input_cost_cents"
        case outputCostCents = "output_cost_cents"
        case totalCostCents = "total_cost_cents"
        case keySource = "key_source"
        case responseTimeMs = "response_time_ms"
        case success
        case errorMessage = "error_message"
        case date
    }
    
    // Helper computed properties
    var totalCostDollars: Double {
        Double(totalCostCents ?? 0) / 100.0
    }
    
    var keySourceDisplay: String {
        switch keySource {
        case "platform": return "Platform Key"
        case "user": return "User Key"
        case "free_tier": return "Free Tier"
        default: return "Unknown"
        }
    }
    
    var operationTypeDisplay: String {
        switch operationType {
        case "claude_code": return "Claude Code"
        case "chat": return "Chat"
        case "template_gen": return "Template Generation"
        case "code_review": return "Code Review"
        default: return operationType?.capitalized ?? "Unknown"
        }
    }
}
