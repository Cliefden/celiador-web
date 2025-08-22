//
//  ConversationContextDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import Supabasable

struct ConversationContextDetail: View {
    var item: ConversationContext
    var body: some View {
        VStack(alignment: .leading) {
            ConversationContextCard(item: item)
        }
        .padding()
    }
}
