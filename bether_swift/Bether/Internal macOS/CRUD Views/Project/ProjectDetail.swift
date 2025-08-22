//
//  ProjectDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import SwiftUI
import Supabasable

struct ProjectDetail: View {
    var item: Project
    @State var conversations = SBTableViewModel<Conversation>()
    @State var user: Profile?
    @State var creator: Profile?
    
    var body: some View {
        VStack(alignment: .leading) {
            ProjectCard(item: item)
            
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
                    
                    if !conversations.items.isEmpty {
                        VStack(alignment: .leading) {
                            Text("Conversations")
                                .font(.headline)
                            
                            ForEach(conversations.items) { conversation in
                                ConversationCard(item: conversation)
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .padding()
        .onFirstAppear {
            conversations.addListener(idName: "projectid", id: item.id.uW)
            
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
            conversations.cancelListener()
        }
    }
}
