//
//  TemplateCategory.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

//enum TemplateCategory: CaseIterable {
//    case all
//    case saas
//    case ecommerce
//    case ai
//    case landing
//    case dashboard
//    case mobile
//    
//    var displayName: String {
//        switch self {
//        case .all: return "All"
//        case .saas: return "SaaS"
//        case .ecommerce: return "E-commerce"
//        case .ai: return "AI Apps"
//        case .landing: return "Landing Pages"
//        case .dashboard: return "Dashboards"
//        case .mobile: return "Mobile"
//        }
//    }
//    
//    var icon: String {
//        switch self {
//        case .all: return "square.grid.2x2"
//        case .saas: return "cloud"
//        case .ecommerce: return "cart"
//        case .ai: return "brain"
//        case .landing: return "doc.text"
//        case .dashboard: return "chart.bar"
//        case .mobile: return "iphone"
//        }
//    }
//}

enum TemplateDifficulty {
    case beginner
    case intermediate
    case advanced
    
    var displayName: String {
        switch self {
        case .beginner: return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced: return "Advanced"
        }
    }
    
    var color: Color {
        switch self {
        case .beginner: return .green
        case .intermediate: return .orange
        case .advanced: return .red
        }
    }
}
