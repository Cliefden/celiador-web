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
    @State var relatedJob: Job?
    @State var parentMessage: Message?
    @State var user: Profile?
    @State var creator: Profile?
    
    var body: some View {
        VStack(alignment: .leading) {
            MessageCard(item: item)
            
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
                    
                    if let relatedJob = relatedJob {
                        VStack(alignment: .leading) {
                            Text("Related Job")
                                .font(.headline)
                            
                            JobCard(item: relatedJob)
                        }
                    }
                    
                    if let parentMessage = parentMessage {
                        VStack(alignment: .leading) {
                            Text("Parent Message")
                                .font(.headline)
                            
                            MessageCard(item: parentMessage)
                        }
                    }
                }
                .padding()
            }
        }
        .padding()
        .onFirstAppear {
            if let relatedJobId = item.relatedJobId {
                Task {
                    let jobs = await SBTableManager<Job>.fetchWithReference(idName: "id", id: relatedJobId)
                    relatedJob = jobs.first
                }
            }
            
            if let parentId = item.parentId {
                Task {
                    let messages = await SBTableManager<Message>.fetchWithReference(idName: "id", id: parentId)
                    parentMessage = messages.first
                }
            }
            
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
    }
}
