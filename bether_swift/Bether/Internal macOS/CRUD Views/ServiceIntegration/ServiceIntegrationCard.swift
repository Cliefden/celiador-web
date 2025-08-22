//
//  ServiceIntegrationCard.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct ServiceIntegrationCard: View {
    let item: ServiceIntegration
    @State private var editItem = false
    @State private var userName: String?

    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: ServiceIntegration.typeName,
                mainText: .init(
                    text: item.service.uW
                ),
                secondText: .init(text: "Service Integration"),
                thirdText: .init(
                    text: "Status: \(item.status.uW)",
                    color: statusColor(for: item.status.uW)
                ),
                fourthText: .init(
                    text: "Model: \(item.config?.model.uW ?? "None")",
                    color: .blue
                ),
                fifthText: .init(
                    text: "Endpoint: \(item.config?.endpoint.uW ?? "None")",
                    color: .green
                ),
                sixthText: .init(
                    text: "User: \(item.userId.uW.uuidString)",
                    color: .secondary
                ),
                seventhText: .init(
                    text: "Last Sync: \(item.lastSync?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .orange
                ),
                eighthText: .init(
                    text: "Last Updated: \(item.updatedAt?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .purple
                )
            )
        } rightSide: {
            CardRightView(
                timeStamp: item.createdAt,
                creator: item.creator,
                firstButton: .init(
                    text: "Edit " + ServiceIntegration.typeName,
                    function: { editItem.toggle() }
                ),
                secondButton: .init(
                    text: "Test Connection",
                    function: { /* TODO: Test service connection */ }
                ),
                thirdButton: .init(
                    text: "View User",
                    function: { /* TODO: Navigate to user */ }
                )
            )
        }
        .sheet(isPresented: $editItem) {
            ServiceIntegrationAddOrEdit(itemToEdit: item)
        }
        .task {
            if let userId = item.userId {
                let profile = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId).first
                userName = profile?.uWName
            }
        }
    }
    
    private func statusColor(for status: String) -> Color {
        switch status.lowercased() {
        case "active":
            return .green
        case "disabled":
            return .orange
        case "error":
            return .red
        default:
            return .gray
        }
    }
}

#Preview {
    ServiceIntegrationCard(item: ServiceIntegration())
}
