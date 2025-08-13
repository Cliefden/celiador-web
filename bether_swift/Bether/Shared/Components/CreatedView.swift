//
//  CreatedView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import Supabasable
import OptionalHelpers

struct CreatedView: View {
    
    let timeStamp: Date?
    let creator: reference?
    @State private var creatorName: String?
    var body: some View {
        Text("Created: " + timeStamp.uW.formatted(date: .abbreviated, time: .shortened) +
             (creatorName != nil ? " by \(creatorName!)" : "")
        )
        .font(.caption)
        .foregroundStyle(.tertiary)
        .task {
            let profile = await SBTableManager<Profile2>.fetchWithReference(idName: "id", id: creator.uW).first
            
            let individual = await SBTableManager<Individual>.fetchWithReference(idName: "id", id: (profile?.individualID).uW).first
            creatorName = individual?.name
        }
    }
}
