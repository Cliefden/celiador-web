//
//  ConversationContextCard.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct ConversationContextCard: View {
    let item: ConversationContext
    @State private var editItem = false
    @State private var userName: String?

    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: ConversationContext.typeName,
                mainText: .init(
                    text: item.contextType.uW
                ),
                secondText: .init(text: "Context Data"),
                thirdText: .init(
                    text: "Type: \(item.contextType.uW)",
                    color: .blue
                ),
                fourthText: .init(
                    text: "Conversation: \(item.conversationId.uW.uuidString)",
                    color: .green
                ),
                fifthText: .init(
                    text: "Project: \(item.projectId.uW.uuidString)",
                    color: .purple
                ),
                sixthText: .init(
                    text: "Last Updated: \(item.lastUpdated?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .orange
                ),
                seventhText: .init(
                    text: "Created: \(item.createdAt?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .secondary
                )
            )
        } rightSide: {
            CardRightView(
                timeStamp: item.createdAt,
                creator: item.creator,
                firstButton: .init(
                    text: "Edit " + ConversationContext.typeName,
                    function: { editItem.toggle() }
                ),
                secondButton: .init(
                    text: "View Conversation",
                    function: { /* TODO: Navigate to conversation */ }
                ),
                thirdButton: .init(
                    text: "View Project",
                    function: { /* TODO: Navigate to project */ }
                )
            )
        }
        .sheet(isPresented: $editItem) {
            ConversationContextAddOrEdit(itemToEdit: item)
        }
        .task {
            if let creator = item.creator {
                let profile = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: creator).first
                userName = profile?.uWName
            }
        }
    }
}

#Preview {
    ConversationContextCard(item: ConversationContext())
}
