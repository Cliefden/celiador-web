//  ProfileDetail.swift
//  Internal macOS
//
//  Created by AI Assistant on 2025-08-14.

import SwiftUI
import Supabasable

struct ProfileDetail: View {
    var item: Profile
    var body: some View {
        VStack(alignment: .leading) {
            ProfileCard(item: item)
        }
        .padding()
    }
}
