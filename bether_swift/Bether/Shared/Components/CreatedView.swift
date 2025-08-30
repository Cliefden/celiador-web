//
//  CreatedView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import Supabasable
import OptionalHelpers
import Naming

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
            if let creator = creator {
                let profile = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: creator).first
                creatorName = profile?.uWName
            }
        }
    }
}
