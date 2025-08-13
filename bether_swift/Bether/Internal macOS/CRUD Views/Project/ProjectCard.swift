//
//  ProjectCard.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import SwiftUI
import OptionalHelpers
import Naming

struct ProjectCard: View {
    let item: Project
    @State private var editItem = false
    
    private var statusColor: Color {
        switch item.status?.lowercased() {
        case "ready":
            return .green
        case "running":
            return .orange
        case "failed":
            return .red
        case "completed":
            return .blue
        default:
            return .secondary
        }
    }

    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: Project.typeName,
                mainText: .init(
                    text: item.uWName
                ),
                secondText: .init(text: item.name.uW),
                thirdText: .init(
                    text: "Template: \(item.templateKey.uW)",
                    color: .blue
                ),
                fourthText: .init(
                    text: "Status: \(item.status.uW)",
                    color: statusColor
                ),
                fifthText: .init(
                    text: "Repository: \(item.repoProvider.uW)/\(item.repoOwner.uW)/\(item.repoName.uW)",
                    color: .green
                ),
                sixthText: .init(
                    text: "User ID: \(item.userId.uW)",
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
                    text: "Edit " + Project.typeName,
                    function: { editItem.toggle() }
                ),
                secondButton: .init(
                    text: "View Jobs",
                    function: { /* TODO: Navigate to jobs */ }
                ),
                thirdButton: .init(
                    text: "View Files",
                    function: { /* TODO: Navigate to files */ }
                )
            )
        }
        .sheet(isPresented: $editItem) {
            ProjectAddOrEdit(itemToEdit: item)
        }
    }
}
