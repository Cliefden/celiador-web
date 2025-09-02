//
//  CostMonitoringView.swift
//  Bether
//
//  Created by Claude on 2025-08-31.
//

import SwiftUI
import Supabasable
import OptionalHelpers
import Charts

struct CostMonitoringView: View {
    @State private var providers = SBTableViewModel<Provider>()
    @State private var apiUsage = SBTableViewModel<ApiUsage>()
    @State private var usageLimits = SBTableViewModel<UserUsageLimit>()
    @State private var selectedTimeframe: TimeFrame = .today
    @State private var isLoading = false
    @State private var lastRefresh = Date()
    
    enum TimeFrame: String, CaseIterable {
        case today = "Today"
        case week = "This Week"
        case month = "This Month"
        case quarter = "This Quarter"
        
        var days: Int {
            switch self {
            case .today: return 1
            case .week: return 7
            case .month: return 30
            case .quarter: return 90
            }
        }
        
        var startDate: Date {
            Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        }
    }
    
    // MARK: - Computed Properties
    
    var platformCostToday: Double {
        let today = Calendar.current.startOfDay(for: Date())
        return apiUsage.items
//            .filter { usage in
//                usage.keySource == "platform" || usage.keySource == "free_tier"
//            }
            .filter { usage in
                guard let date = usage.date else { return false }
                return Calendar.current.isDate(date, inSameDayAs: today)
            }
            .compactMap { Double($0.totalCostCents.uW) }
            .reduce(0, +) / 100.0
    }
    
    var platformCostThisMonth: Double {
        let startOfMonth = Calendar.current.dateInterval(of: .month, for: Date())?.start ?? Date()
        return apiUsage.items
            .filter { usage in
                usage.keySource == "platform" || usage.keySource == "free_tier"
            }
            .filter { usage in
                guard let date = usage.date else { return false }
                return date >= startOfMonth
            }
            .compactMap { Double($0.totalCostCents.uW) }
            .reduce(0, +) / 100.0
    }
    
    var totalActiveUsers: Int {
        Set<UUID?>(apiUsage.items.compactMap { usage in
            guard let projectId = usage.projectId else { return nil }
            // Would need to join with projects to get userId - simplified for now
            return projectId
        }).count
    }
    
    var byokAdoptionRate: Double {
        let totalUsers = Double(totalActiveUsers)
        guard totalUsers > 0 else { return 0.0 }
        
        let usersWithKeys = usageLimits.items
            .filter { limit in
                // Check if user has active API keys
                return providers.items.contains { provider in
                    // This would need actual user API key check - simplified
                    return true
                }
            }.count
        
        return Double(usersWithKeys) / totalUsers * 100.0
    }
    
    var avgCostPerUser: Double {
        guard totalActiveUsers > 0 else { return 0.0 }
        return platformCostToday / Double(totalActiveUsers)
    }
    
    // Daily cost data for the last 30 days
    var dailyCostData: [DailyCost] {
        let calendar = Calendar.current
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        
        var costsByDay: [Date: Double] = [:]
        
        // Group usage by day
        for usage in apiUsage.items {
            guard let date = usage.date,
                  date >= thirtyDaysAgo,
                  usage.keySource == "platform" || usage.keySource == "free_tier",
                  let cost = usage.totalCostCents else { continue }
            
            let dayStart = calendar.startOfDay(for: date)
            costsByDay[dayStart, default: 0.0] += Double(cost) / 100.0
        }
        
        // Create array of daily costs for the last 30 days
        var result: [DailyCost] = []
        for i in 0..<30 {
            if let date = calendar.date(byAdding: .day, value: -i, to: Date()) {
                let dayStart = calendar.startOfDay(for: date)
                let cost = costsByDay[dayStart] ?? 0.0
                result.append(DailyCost(date: dayStart, cost: cost))
            }
        }
        
        return result.reversed() // Show oldest to newest
    }
    
    // Monthly cost data for the last 12 months
    var monthlyCostData: [MonthlyCost] {
        let calendar = Calendar.current
        let twelveMonthsAgo = calendar.date(byAdding: .month, value: -12, to: Date()) ?? Date()
        
        var costsByMonth: [String: Double] = [:]
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        
        // Group usage by month
        for usage in apiUsage.items {
            guard let date = usage.date,
                  date >= twelveMonthsAgo,
                  usage.keySource == "platform" || usage.keySource == "free_tier",
                  let cost = usage.totalCostCents else { continue }
            
            let monthKey = formatter.string(from: date)
            costsByMonth[monthKey, default: 0.0] += Double(cost) / 100.0
        }
        
        // Create array of monthly costs for the last 12 months
        var result: [MonthlyCost] = []
        for i in 0..<12 {
            if let date = calendar.date(byAdding: .month, value: -i, to: Date()) {
                let monthKey = formatter.string(from: date)
                let cost = costsByMonth[monthKey] ?? 0.0
                result.append(MonthlyCost(date: date, cost: cost, monthKey: monthKey))
            }
        }
        
        return result.reversed() // Show oldest to newest
    }
    
    // MARK: - View Body
    
    var body: some View {
//        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    headerSection
                    
                    // Real-time Metrics Cards
                    metricsCardsSection
                    
                    // Time-based Analytics
                    analyticsSection
                    
                    // Provider Breakdown
                    providerBreakdownSection
                    
                    // Recent High-Cost Operations
                    recentOperationsSection
                }
                .padding()
            }
            .navigationTitle("Cost Monitoring")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: refreshData) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
            }
//        }
        .onFirstAppear {
            providers.addListener()
            apiUsage.addListener()
            usageLimits.addListener()
            refreshData()
        }
        .onDisappear {
            providers.cancelListener()
            apiUsage.cancelListener()
            usageLimits.cancelListener()
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.title2)
                    .foregroundColor(.green)
                
                Text("Platform Cost Dashboard")
                    .font(.title)
                    .fontWeight(.bold)
                
                Spacer()
                
                Text("Last updated: \(lastRefresh, style: .time)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text("Monitor API costs, free tier usage, and BYOK adoption rates")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Metrics Cards
    
    private var metricsCardsSection: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            
            MetricCard(
                title: "Today's Burn Rate",
                value: String(format: "$%.2f", platformCostToday),
                subtitle: "Platform API costs",
                icon: "flame.fill",
                color: platformCostToday > 10.0 ? .red : .orange
            )
            
            MetricCard(
                title: "Monthly Total",
                value: String(format: "$%.2f", platformCostThisMonth),
                subtitle: "This month's costs",
                icon: "calendar",
                color: .blue
            )
            
            MetricCard(
                title: "BYOK Adoption",
                value: String(format: "%.1f%%", byokAdoptionRate),
                subtitle: "Users with own keys",
                icon: "key.fill",
                color: byokAdoptionRate > 50 ? .green : .yellow
            )
            
            MetricCard(
                title: "Cost Per User",
                value: String(format: "$%.3f", avgCostPerUser),
                subtitle: "Daily average",
                icon: "person.circle",
                color: .purple
            )
        }
    }
    
    // MARK: - Analytics Section
    
    private var analyticsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Cost Analytics")
                    .font(.headline)
                
                Spacer()
                
                Picker("Timeframe", selection: $selectedTimeframe) {
                    ForEach(TimeFrame.allCases, id: \.self) { timeframe in
                        Text(timeframe.rawValue).tag(timeframe)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(maxWidth: 300)
            }
            
            // Cost breakdown charts
            HStack(spacing: 20) {
                // Daily cost chart
                VStack(alignment: .leading, spacing: 12) {
                    Text("Daily Costs (30 days)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Chart(dailyCostData) { item in
                        LineMark(
                            x: .value("Date", item.date),
                            y: .value("Cost", item.cost)
                        )
                        .foregroundStyle(.blue)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        
                        AreaMark(
                            x: .value("Date", item.date),
                            y: .value("Cost", item.cost)
                        )
                        .foregroundStyle(.blue.opacity(0.1))
                    }
                    .frame(height: 150)
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .day, count: 7)) { _ in
                            AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                        }
                    }
                    .chartYAxis {
                        AxisMarks { _ in
                            AxisValueLabel(format: .currency(code: "USD"))
                        }
                    }
                }
                .padding()
                .background(Color(.controlBackgroundColor))
                .cornerRadius(12)
                
                // Monthly cost chart
                VStack(alignment: .leading, spacing: 12) {
                    Text("Monthly Costs (12 months)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Chart(monthlyCostData) { item in
                        BarMark(
                            x: .value("Month", item.date),
                            y: .value("Cost", item.cost)
                        )
                        .foregroundStyle(.green)
                        .cornerRadius(4)
                    }
                    .frame(height: 150)
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .month, count: 2)) { _ in
                            AxisValueLabel(format: .dateTime.month(.abbreviated))
                        }
                    }
                    .chartYAxis {
                        AxisMarks { _ in
                            AxisValueLabel(format: .currency(code: "USD"))
                        }
                    }
                }
                .padding()
                .background(Color(.controlBackgroundColor))
                .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Provider Breakdown
    
    private var providerBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Provider Cost Breakdown")
                .font(.headline)
            
            ForEach(providers.items.filter { $0.deleter == nil }, id: \.id) { provider in
                ProviderCostRow(
                    provider: provider,
                    usage: apiUsage.items.filter { $0.providerId == provider.id }
                )
            }
        }
    }
    
    // MARK: - Recent Operations
    
    private var recentOperationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recent High-Cost Operations")
                .font(.headline)
            
            ForEach(
                apiUsage.items
                    .filter { $0.deleter == nil }
                    .filter { ($0.totalCostCents ?? 0) > 10 } // > $0.10
                    .sorted { 
                        ($0.createdAt ?? Date.distantPast) > ($1.createdAt ?? Date.distantPast)
                    }
                    .prefix(10),
                id: \.id
            ) { usage in
                HighCostOperationRow(usage: usage)
            }
        }
    }
    
    // MARK: - Actions
    
    private func refreshData() {
        isLoading = true
        lastRefresh = Date()
        
        // Force refresh all data
        Task {
            try? await Task.sleep(nanoseconds: 500_000_000) // Simulate refresh
            await MainActor.run {
                isLoading = false
            }
        }
    }
}

// MARK: - Metric Card Component

struct MetricCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Provider Cost Row

struct ProviderCostRow: View {
    let provider: Provider
    let usage: [ApiUsage]
    
    private var totalCost: Double {
        usage.compactMap { Double($0.totalCostCents.uW) }.reduce(0, +) / 100.0
    }
    
    private var totalRequests: Int {
        usage.count
    }
    
    private var avgResponseTime: Double {
        let responseTimes = usage.compactMap { $0.responseTimeMs }
        guard !responseTimes.isEmpty else { return 0.0 }
        return Double(responseTimes.reduce(0, +)) / Double(responseTimes.count)
    }
    
    var body: some View {
        HStack {
            Circle()
                .fill(provider.statusColor)
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(provider.displayName.uW)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("\(totalRequests) requests")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "$%.2f", totalCost))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(totalCost > 1.0 ? .red : .primary)
                
                Text(String(format: "%.0fms avg", avgResponseTime))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.controlBackgroundColor))
        .cornerRadius(8)
    }
}

// MARK: - High Cost Operation Row

struct HighCostOperationRow: View {
    let usage: ApiUsage
    
    var body: some View {
        HStack {
            Image(systemName: operationIcon)
                .font(.title3)
                .foregroundColor(operationColor)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(usage.operationTypeDisplay)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                HStack(spacing: 8) {
                    Text("\(usage.totalTokens ?? 0) tokens")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(usage.keySourceDisplay)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "$%.3f", usage.totalCostDollars))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.red)
                
                if let responseTime = usage.responseTimeMs {
                    Text("\(responseTime)ms")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal)
        .background(Color(.controlBackgroundColor))
        .cornerRadius(8)
    }
    
    private var operationIcon: String {
        switch usage.operationType {
        case "claude_code": return "terminal"
        case "chat": return "message"
        case "template_gen": return "doc.text"
        case "code_review": return "checkmark.circle"
        default: return "cpu"
        }
    }
    
    private var operationColor: Color {
        switch usage.operationType {
        case "claude_code": return .blue
        case "chat": return .green
        case "template_gen": return .purple
        case "code_review": return .orange
        default: return .gray
        }
    }
}

// MARK: - Chart Data Models

struct DailyCost: Identifiable {
    let id = UUID()
    let date: Date
    let cost: Double
}

struct MonthlyCost: Identifiable {
    let id = UUID()
    let date: Date
    let cost: Double
    let monthKey: String
}
