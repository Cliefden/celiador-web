//
//  ContentView.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import SwiftUI
import Supabasable

struct ContentView: View {
    @State private var selectedTab: AdminTab = .costMonitoring
    
    enum AdminTab: String, CaseIterable {
        case costMonitoring = "Cost Monitoring"
        case templateManagement = "Templates"
        case userManagement = "User Management"
        case providers = "Providers"
        case analytics = "Analytics"
        
        var icon: String {
            switch self {
            case .costMonitoring: return "dollarsign.circle"
            case .templateManagement: return "square.grid.2x2"
            case .userManagement: return "person.2"
            case .providers: return "server.rack"
            case .analytics: return "chart.bar"
            }
        }
    }
    
    var body: some View {
        NavigationView {
            // Sidebar
            List(AdminTab.allCases, id: \.self, selection: $selectedTab) { tab in
                NavigationLink(value: tab) {
                    Label(tab.rawValue, systemImage: tab.icon)
                }
            }
            .navigationTitle("Bether Admin")
            .navigationSplitViewColumnWidth(min: 200, ideal: 250)
            
            // Main Content
            Group {
                switch selectedTab {
                case .costMonitoring:
                    CostMonitoringView()
                case .templateManagement:
                    TemplateManagementView()
                case .userManagement:
                    Text("User Management - Coming Soon")
                        .font(.title2)
                        .foregroundColor(.secondary)
                case .providers:
                    Text("Provider Management - Coming Soon")
                        .font(.title2)
                        .foregroundColor(.secondary)
                case .analytics:
                    Text("Analytics Dashboard - Coming Soon")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationSplitViewStyle(.balanced)
    }
}

#Preview {
    ContentView()
}
