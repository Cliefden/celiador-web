//
//  Provider.swift
//  Bether
//
//  Created by Claude on 2025-08-31.
//

import Foundation
import SwiftUI
import Supabasable
import Naming

struct Provider:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Named
{
    static let path = "providers"
    static let idName = "id"
    static let typeName = "Provider"
    static let icon = "server.rack"
    static let color: ModelColor = .green
    
    var id: UUID?
    var createdAt: Date?
    var updatedAt: Date?
    var deletedAt: Date?
    var creator: UUID?
    var updater: UUID?
    var deleter: UUID?
    
    // Provider identification
    var providerKey: String?
    var displayName: String?
    var description: String?
    var logoUrl: String?
    var websiteUrl: String?
    var docsUrl: String?
    var signupUrl: String?
    
    // API configuration
    var apiBaseUrl: String?
    var authType: String?
    var authHeaderFormat: String?
    
    // Rate limits
    var rateLimitRpm: Int?
    var rateLimitTpm: Int?
    var rateLimitRpd: Int?
    
    // Pricing
    var pricingModel: String?
    var inputCostPer1mTokens: Double?
    var outputCostPer1mTokens: Double?
    var requestBaseCostCents: Int?
    var currency: String?
    
    // Model configuration
    var defaultModel: String?
    var supportedModels: String? // JSON string
    var maxContextTokens: Int?
    var maxOutputTokens: Int?
    
    // Capabilities
    var supportsStreaming: Bool?
    var supportsFunctions: Bool?
    var supportsVision: Bool?
    var supportsCodeExecution: Bool?
    
    // Status
    var isActive: Bool?
    var requiresApproval: Bool?
    var maintenanceMode: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case deletedAt = "deleted_at"
        case creator
        case updater
        case deleter
        
        case providerKey = "provider_key"
        case displayName = "display_name"
        case description
        case logoUrl = "logo_url"
        case websiteUrl = "website_url"
        case docsUrl = "docs_url"
        case signupUrl = "signup_url"
        
        case apiBaseUrl = "api_base_url"
        case authType = "auth_type"
        case authHeaderFormat = "auth_header_format"
        
        case rateLimitRpm = "rate_limit_rpm"
        case rateLimitTpm = "rate_limit_tpm"
        case rateLimitRpd = "rate_limit_rpd"
        
        case pricingModel = "pricing_model"
        case inputCostPer1mTokens = "input_cost_per_1m_tokens"
        case outputCostPer1mTokens = "output_cost_per_1m_tokens"
        case requestBaseCostCents = "request_base_cost_cents"
        case currency
        
        case defaultModel = "default_model"
        case supportedModels = "supported_models"
        case maxContextTokens = "max_context_tokens"
        case maxOutputTokens = "max_output_tokens"
        
        case supportsStreaming = "supports_streaming"
        case supportsFunctions = "supports_functions"
        case supportsVision = "supports_vision"
        case supportsCodeExecution = "supports_code_execution"
        
        case isActive = "is_active"
        case requiresApproval = "requires_approval"
        case maintenanceMode = "maintenance_mode"
    }
    
    // Helper computed properties
    var costPerMillionTokens: String {
        guard let inputCost = inputCostPer1mTokens,
              let outputCost = outputCostPer1mTokens else {
            return "N/A"
        }
        return String(format: "$%.2f / $%.2f", inputCost / 100, outputCost / 100)
    }
    
    var statusText: String {
        if maintenanceMode == true {
            return "Maintenance"
        } else if isActive == true {
            return "Active"
        } else {
            return "Inactive"
        }
    }
    
    var statusColor: Color {
        if maintenanceMode == true {
            return .orange
        } else if isActive == true {
            return .green
        } else {
            return .red
        }
    }
    
    var name: String? {
        displayName
    }
}

// MARK: - User API Key Model


// MARK: - API Usage Model



// MARK: - User Usage Limits Model

