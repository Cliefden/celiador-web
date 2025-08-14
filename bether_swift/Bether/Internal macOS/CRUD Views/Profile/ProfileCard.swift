//  ProfileCard.swift
//  Internal macOS
//
//  Created by AI Assistant on 2025-08-14.

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct ProfileCard: View {
    let item: Profile
    @State private var editItem = false
    
    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: Profile.typeName,
                mainText: .init(text: item.uWName),
                secondText: .init(text: item.fullName.uW),
                thirdText: .init(text: item.username.uW, color: .blue),
                fourthText: .init(text: item.email.uW, color: .green),
                fifthText: .init(text: item.website.uW, color: .purple),
                sixthText: .init(text: item.phoneNumber.uW, color: .orange),
                seventhText: .init(text: item.role?.rawValue ?? "", color: .gray),
                eighthText: .init(
                    text: "Last Updated: \(item.updatedAt?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .orange
                )
            )
        } rightSide: {
            CardRightView(
                timeStamp: item.updatedAt,
                creator: item.creator,
                firstButton: .init(
                    text: "Edit " + Profile.typeName,
                    function: { editItem.toggle() }
                ),
                secondButton: .init(
                    text: "View Projects",
                    function: { /* TODO: Navigate to projects */ }
                ),
                thirdButton: .init(
                    text: "View Jobs",
                    function: { /* TODO: Navigate to jobs */ }
                )
            )
        }
        .sheet(isPresented: $editItem) {
            ProfileAddOrEdit(itemToEdit: item)
        }
    }
}
