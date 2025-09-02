//
//  Enums.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

enum ProjectTemplate: String, CaseIterable {
    case nextjsApp = "blank-nextjs"
    case reactApp = "react-typescript"
    case nextSupabase = "next-prisma-supabase"
    case blogPlatform = "blog-platform"
    case aiChatApp = "ai-chat-app"
    case ecommerceStore = "ecommerce-storefront"
    case landingPage = "landing-page"
    case dashboardApp = "dashboard-app"
    case aiSaasDashboard = "ai-saas-dashboard"
    case nextSaasStarter = "next-saas-starter"
    
    var icon: String {
        switch self {
        case .nextjsApp: return "globe"
        case .reactApp: return "atom"
        case .nextSupabase: return "swiftdata"
        case .blogPlatform: return "book.fill"
        case .aiChatApp: return "brain"
        case .ecommerceStore: return "cart"
        case .landingPage: return "doc.text"
        case .dashboardApp: return "graph.bar"
        case .aiSaasDashboard: return "brain"
        case .nextSaasStarter: return "cloud.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .nextjsApp: return .blue
        case .reactApp: return .yellow
        case .nextSupabase: return .purple
        case .blogPlatform: return .green
        case .aiChatApp: return .orange
        case .ecommerceStore: return .gray
        case .landingPage: return .red
        case .dashboardApp: return .teal
        case .aiSaasDashboard: return .pink
        case .nextSaasStarter: return .indigo
        }
    }
}


//
enum ProjectStatus: String, CaseIterable {
    case generating = "GENERATING"
    case ready = "READY"
    case deployed = "DEPLOYED"
    case error = "ERROR"
    
    var color: Color {
        switch self {
        case .generating: return .orange
        case .ready: return .green
        case .deployed: return .blue
        case .error: return .red
        }
    }
}
