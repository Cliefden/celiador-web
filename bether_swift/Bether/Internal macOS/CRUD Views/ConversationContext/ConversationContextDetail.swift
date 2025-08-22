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
    @State var conversation: Conversation?
    @State var project: Project?
    @State var creator: Profile?
    
    var body: some View {
        VStack(alignment: .leading) {
            ConversationContextCard(item: item)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let creator = creator {
                        VStack(alignment: .leading) {
                            Text("Creator")
                                .font(.headline)
                            
                            ProfileCard(item: creator)
                        }
                    }
                    
                    if let conversation = conversation {
                        VStack(alignment: .leading) {
                            Text("Conversation")
                                .font(.headline)
                            
                            ConversationCard(item: conversation)
                        }
                    }
                    
                    if let project = project {
                        VStack(alignment: .leading) {
                            Text("Project")
                                .font(.headline)
                            
                            ProjectCard(item: project)
                        }
                    }
                }
                .padding()
            }
        }
        .padding()
        .onFirstAppear {
            if let conversationId = item.conversationId {
                Task {
                    let conversations = await SBTableManager<Conversation>.fetchWithReference(idName: "id", id: conversationId)
                    conversation = conversations.first
                }
            }
            
            if let projectId = item.projectId {
                Task {
                    let projects = await SBTableManager<Project>.fetchWithReference(idName: "id", id: projectId)
                    project = projects.first
                }
            }
            
            if let creatorId = item.creator {
                Task {
                    let profiles = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: creatorId)
                    creator = profiles.first
                }
            }
        }
    }
}
