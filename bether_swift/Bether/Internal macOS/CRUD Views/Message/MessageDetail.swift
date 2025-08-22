//
//  MessageDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import Supabasable

struct MessageDetail: View {
    var item: Message
    var body: some View {
        VStack(alignment: .leading) {
            MessageCard(item: item)
        }
        .padding()
    }
}
