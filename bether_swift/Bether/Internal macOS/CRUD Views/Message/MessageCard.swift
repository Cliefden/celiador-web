//
//  MessageCard.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct MessageCard: View {
    let item: Message
    @State private var editItem = false
    @State private var userName: String?

    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: Message.typeName,
                mainText: .init(
                    text: item.content.uW
                ),
                secondText: .init(text: item.role.uW),
                thirdText: .init(
                    text: "Role: \(item.role.uW)",
                    color: roleColor(for: item.role.uW)
                ),
                fourthText: .init(
                    text: "Type: \(item.messageType.uW)",
                    color: .blue
                ),
                fifthText: .init(
                    text: "Conversation: \(item.conversationId.uW.uuidString)",
                    color: .green
                ),
                sixthText: .init(
                    text: "User: \(item.userId.uW.uuidString)",
                    color: .secondary
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
                    text: "Edit " + Message.typeName,
                    function: { editItem.toggle() }
                ),
                secondButton: .init(
                    text: "View Conversation",
                    function: { /* TODO: Navigate to conversation */ }
                ),
                thirdButton: .init(
                    text: "View Related Job",
                    function: { /* TODO: Navigate to related job */ }
                )
            )
        }
        .sheet(isPresented: $editItem) {
            MessageAddOrEdit(itemToEdit: item)
        }
        .task {
            if let userId = item.userId {
                let profile = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId).first
                userName = profile?.uWName
            }
        }
    }
    
    private func roleColor(for role: String) -> Color {
        switch role.lowercased() {
        case "user":
            return .blue
        case "assistant":
            return .green
        case "system":
            return .purple
        default:
            return .gray
        }
    }
}

#Preview {
    MessageCard(item: Message())
}
