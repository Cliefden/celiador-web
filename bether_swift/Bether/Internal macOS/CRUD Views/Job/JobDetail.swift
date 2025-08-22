//
//  JobDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-14.
//

import SwiftUI
import Supabasable

struct JobDetail: View {
    var item: Job
    @State var relatedMessages = SBTableViewModel<Message>()
    @State var user: Profile?
    @State var creator: Profile?
    
    var body: some View {
        VStack(alignment: .leading) {
            JobCard(item: item)
            
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
                    
                    if !relatedMessages.items.isEmpty {
                        VStack(alignment: .leading) {
                            Text("Related Messages")
                                .font(.headline)
                            
                            ForEach(relatedMessages.items) { message in
                                MessageCard(item: message)
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .padding()
        .onFirstAppear {
            relatedMessages.addListener(idName: "relatedjobid", id: item.id.uW)
            
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
            relatedMessages.cancelListener()
        }
    }
}
