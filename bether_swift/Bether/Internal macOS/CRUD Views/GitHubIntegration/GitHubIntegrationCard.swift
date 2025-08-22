//
//  GitHubIntegrationCard.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct GitHubIntegrationCard: View {
    let item: GitHubIntegration
    @State private var editItem = false
    @State private var userName: String?

    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: GitHubIntegration.typeName,
                mainText: .init(
                    text: "GitHub Integration"
                ),
                secondText: .init(text: "OAuth Integration"),
                thirdText: .init(
                    text: "Status: \(connectionStatus)",
                    color: connectionStatusColor
                ),
                fourthText: .init(
                    text: "Installation: \(item.installationId.uW)",
                    color: .blue
                ),
                fifthText: .init(
                    text: "User: \(item.userId?.uuidString ?? "Unknown")",
                    color: .secondary
                ),
                sixthText: .init(
                    text: "Scopes: \(item.scope?.joined(separator: ", ") ?? "None")",
                    color: .green
                ),
                seventhText: .init(
                    text: "Last Updated: \(item.updatedAt?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .orange
                )
            )
        } rightSide: {
            CardRightView(
                timeStamp: item.createdAt,
                creator: item.creator,
                firstButton: .init(
                    text: "Edit " + GitHubIntegration.typeName,
                    function: { editItem.toggle() }
                ),
                secondButton: .init(
                    text: "Refresh Token",
                    function: { /* TODO: Refresh token */ }
                ),
                thirdButton: .init(
                    text: "View User",
                    function: { /* TODO: Navigate to user */ }
                )
            )
        }
        .sheet(isPresented: $editItem) {
            GitHubIntegrationAddOrEdit(itemToEdit: item)
        }
        .task {
            if let userId = item.userId {
                let profile = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId).first
                userName = profile?.uWName
            }
        }
    }
    
    private var connectionStatus: String {
        if let accessToken = item.accessToken, !accessToken.isEmpty {
            return "Connected"
        } else {
            return "Not Connected"
        }
    }
    
    private var connectionStatusColor: Color {
        if let accessToken = item.accessToken, !accessToken.isEmpty {
            return .green
        } else {
            return .red
        }
    }
}

#Preview {
    GitHubIntegrationCard(item: GitHubIntegration())
}

