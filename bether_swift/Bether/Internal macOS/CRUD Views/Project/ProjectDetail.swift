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
    var body: some View {
        VStack(alignment: .leading) {
            ProjectCard(item: item)
            ScrollView {
                ForEach(conversations.items) { item in
                    ConversationCard(item: item)
                }
            }
            .padding()
            .onFirstAppear {
                conversations.addListener(idName: "projectid", id: item.id.uW)
            }
            .onDisappear {
                conversations.cancelListener()
            }
        }
        .padding()
    }
}
