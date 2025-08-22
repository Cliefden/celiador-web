//
//  SideBar.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import SwiftUI

struct SideBar: View {
    var body: some View {
        List {
            NavigationLink("Projects") {
                NamedEntityList(
                    detailView: { AnyView(ProjectDetail(item: $0)) },
                    editView: { AnyView(ProjectAddOrEdit(itemToEdit: $0)) }
                )
            }
            NavigationLink("Jobs") {
                NamedEntityList(
                    detailView: { AnyView(JobDetail(item: $0)) },
                    editView: { AnyView(JobAddOrEdit(itemToEdit: $0)) }
                )
            }
            NavigationLink("Profiles") {
                NamedEntityList(
                    detailView: { AnyView(ProfileDetail(item: $0)) },
                    editView: { AnyView(ProfileAddOrEdit(itemToEdit: $0)) }
                )
            }
            
            // Conversation-related tables
            NavigationLink("Conversations") {
                NamedEntityList(
                    detailView: { AnyView(ConversationDetail(item: $0)) },
                    editView: { AnyView(ConversationAddOrEdit(itemToEdit: $0)) }
                )
            }
            NavigationLink("Messages") {
                NamedEntityList(
                    detailView: { AnyView(MessageDetail(item: $0)) },
                    editView: { AnyView(MessageAddOrEdit(itemToEdit: $0)) }
                )
            }
            NavigationLink("Conversation Contexts") {
                NamedEntityList(
                    detailView: { AnyView(ConversationContextDetail(item: $0)) },
                    editView: { AnyView(ConversationContextAddOrEdit(itemToEdit: $0)) }
                )
            }
            
            // Integration tables
            NavigationLink("GitHub Integrations") {
                NamedEntityList(
                    detailView: { AnyView(GitHubIntegrationDetail(item: $0)) },
                    editView: { AnyView(GitHubIntegrationAddOrEdit(itemToEdit: $0)) }
                )
            }
            NavigationLink("Service Integrations") {
                NamedEntityList(
                    detailView: { AnyView(ServiceIntegrationDetail(item: $0)) },
                    editView: { AnyView(ServiceIntegrationAddOrEdit(itemToEdit: $0)) }
                )
            }
        }
    }
}

#Preview {
    SideBar()
}
