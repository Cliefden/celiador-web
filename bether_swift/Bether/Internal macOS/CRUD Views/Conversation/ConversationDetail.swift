//
//  ConversationDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import Supabasable
import OptionalHelpers

struct ConversationDetail: View {
    var item: Conversation
    @State var messages = SBTableViewModel<Message>()
    var body: some View {
        VStack(alignment: .leading) {
            ConversationCard(item: item)
            ScrollView {
                ForEach(messages.items) { message in
                    MessageCard(item: message)
                }
            }
        }
        .padding()
        .onFirstAppear {
            messages.addListener(idName: "conversationid", id: item.id.uW)
        }
        .onDisappear {
            messages.cancelListener()
        }
            
    }
}
