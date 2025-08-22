//
//  ConversationCard.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct ConversationCard: View {
    let item: Conversation
    @State private var editItem = false
    @State private var userName: String?

    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: Conversation.typeName,
                mainText: .init(
                    text: item.title.uW
                ),
                secondText: .init(text: item.status.uW),
                thirdText: .init(
                    text: "Status: \(item.status.uW)",
                    color: statusColor(for: item.status.uW)
                ),
                fourthText: .init(
                    text: "Project: \(item.projectId.uW.uuidString)",
                    color: .blue
                ),
                fifthText: .init(
                    text: "User: \(item.userId.uW.uuidString)",
                    color: .secondary
                ),
                sixthText: .init(
                    text: "Last Updated: \(item.updatedAt?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .orange
                )
            )
        } rightSide: {
            CardRightView(
                timeStamp: item.createdAt,
                creator: item.creator,
                firstButton: .init(
                    text: "Edit " + Conversation.typeName,
                    function: { editItem.toggle() }
                ),
                secondButton: .init(
                    text: "View Messages",
                    function: { /* TODO: Navigate to messages */ }
                ),
                thirdButton: .init(
                    text: "View Context",
                    function: { /* TODO: Navigate to context */ }
                )
            )
        }
        .sheet(isPresented: $editItem) {
            ConversationAddOrEdit(itemToEdit: item)
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
        case "archived":
            return .orange
        case "deleted":
            return .red
        default:
            return .gray
        }
    }
}

#Preview {
    ConversationCard(item: Conversation())
}
