//
//  JobCard.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-14.
//

import SwiftUI
import OptionalHelpers
import Naming
import Supabasable

struct JobCard: View {
    let item: Job
    @State private var editItem = false
    @State private var userName: String?
    
    var body: some View {
        CardView(item: item) {
            EmptyView()
        } leftSide: {
            CardLeftView(
                headerText: Job.typeName,
                mainText: .init(
                    text: item.prompt.uW
                ),
                secondText: .init(text: item.type.uW),
                thirdText: .init(
                    text: "Status: \(item.status.uW)",
                    color: .gray
                ),
                fourthText: .init(
                    text: "User: \(item.userId.uW.uuidString)",
                    color: .secondary
                ),
                fifthText: .init(
                    text: "Project: \(item.projectId.uW.uuidString)",
                    color: .blue
                ),
                sixthText: .init(
                    text: "Output: \(item.output.uW)",
                    color: .green
                ),
                seventhText: .init(
                    text: "Error: \(item.error.uW)",
                    color: .red
                ),
                eighthText: .init(
                    text: "Last Updated: \(item.updatedAt?.formatted(date: .abbreviated, time: .shortened) ?? "Never")",
                    color: .orange
                )
            )
        } rightSide: {
            CardRightView(
                timeStamp: item.createdAt,
                creator: item.creator,
                firstButton: .init(
                    text: "Edit " + Job.typeName,
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
            JobAddOrEdit(itemToEdit: item)
        }
        .task {
            if let userId = item.userId {
                let profile = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId).first
                userName = profile?.uWName
            }
        }
    }
}
