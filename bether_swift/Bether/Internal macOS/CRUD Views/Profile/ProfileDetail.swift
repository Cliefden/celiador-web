//  ProfileDetail.swift
//  Internal macOS
//
//  Created by AI Assistant on 2025-08-14.

import SwiftUI
import Supabasable

struct ProfileDetail: View {
    var item: Profile
    @State var projects = SBTableViewModel<Project>()
    var body: some View {
        VStack(alignment: .leading) {
            ProfileCard(item: item)
            ScrollView {
                ForEach(projects.items) { project in
                    ProjectCard(item: project)
                }
            }
        }
        .padding().onFirstAppear {
            projects.addListener(idName: "userid", id: item.id.uW)
        }
        .onDisappear {
            projects.cancelListener()
        }
    }
}
