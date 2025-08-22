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
    @State var contexts = SBTableViewModel<ConversationContext>()
    @State var user: Profile?
    @State var creator: Profile?
    
    var body: some View {
        VStack(alignment: .leading) {
            ConversationCard(item: item)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let user = user {
                        VStack(alignment: .leading) {
                            Text("User")
                                .font(.headline)
                            
                            ProfileCard(item: user)
                        }
                    }
                    
                    if let creator = creator {
                        VStack(alignment: .leading) {
                            Text("Creator")
                                .font(.headline)
                            
                            ProfileCard(item: creator)
                        }
                    }
                    
                    if !messages.items.isEmpty {
                        VStack(alignment: .leading) {
                            Text("Messages")
                                .font(.headline)
                            
                            ForEach(messages.items) { message in
                                MessageCard(item: message)
                            }
                        }
                    }
                    
                    if !contexts.items.isEmpty {
                        VStack(alignment: .leading) {
                            Text("Contexts")
                                .font(.headline)
                            
                            ForEach(contexts.items) { context in
                                ConversationContextCard(item: context)
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .padding()
        .onFirstAppear {
            messages.addListener(idName: "conversationid", id: item.id.uW)
            contexts.addListener(idName: "conversationid", id: item.id.uW)
            
            if let userId = item.userId {
                Task {
                    let profiles = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId)
                    user = profiles.first
                }
            }
            
            if let creatorId = item.creator {
                Task {
                    let profiles = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: creatorId)
                    creator = profiles.first
                }
            }
        }
        .onDisappear {
            messages.cancelListener()
            contexts.cancelListener()
        }
    }
}
