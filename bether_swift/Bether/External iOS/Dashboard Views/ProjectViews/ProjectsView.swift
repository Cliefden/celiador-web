//
//  ProjectsView.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-29.
//

import SwiftUI
import Supabasable
import OptionalHelpers
import Auth

struct ProjectsView: View {
    @Environment(SBProfileViewModel.self) var profile
    @Environment(SBAuthViewModel.self) var auth
    @State private var projects = SBTableViewModel<Project>()
    
//    @State private var projects = sampleProjects
    @State private var showingCreateProject = false
    @State private var searchText = ""
    
    var filteredProjects: [Project] {
        var tempProjects: [Project] = []
        
        tempProjects = projects.items.filter { $0.userId == auth.currentUser?.id && $0.deleter == nil }
        
        if searchText.isEmpty {
            return tempProjects
        }
        return tempProjects.filter { $0.name.uW.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
            VStack(spacing: 0) {
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    
                    TextField("Search projects...", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .padding(.horizontal)
                .padding(.top)
                
                ScrollView {
                    LazyVStack {
                        ForEach(filteredProjects) { item in
                            NavigationLink(destination: ProjectDetailiOS(project: item)) {
                                ProjectCard_iOS(project: item)
                            }
                        }
                    }
                }
                
//                if filteredProjects.isEmpty {
//                    // Empty State
//                    VStack(spacing: 24) {
//                        Image(systemName: "brain")
//                            .font(.system(size: 60))
//                            .foregroundColor(.blue.opacity(0.6))
//                        
//                        VStack(spacing: 12) {
//                            Text("No Projects Yet")
//                                .font(.title2)
//                                .fontWeight(.bold)
//                                .foregroundColor(.primary)
//                            
//                            Text("Start building amazing apps with AI.\nCreate your first project to get started!")
//                                .font(.body)
//                                .foregroundColor(.secondary)
//                                .multilineTextAlignment(.center)
//                        }
//                        
//                        Button("Create Your First Project") {
//                            showingCreateProject = true
//                        }
//                        .buttonStyle(PrimaryButtonStyle())
//                    }
//                    .frame(maxWidth: .infinity, maxHeight: .infinity)
//                    .padding()
//                } else {
//                    // Projects List
//                    ScrollView {
//                        LazyVStack(spacing: 16) {
//                            ForEach(filteredProjects) { project in
//                                ProjectCard(project: project)
//                            }
//                        }
//                        .padding()
//                    }
//                }
            .toolbar {
                ToolbarItem {
                    Button {
                        showingCreateProject = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreateProject) {
                CreateProjectSheet()
            }
        }
        .onFirstAppear {
            projects.addListener()
        }
        .onDisappear {
            projects.cancelListener()
        }
    }
}

#Preview {
    ProjectsView()
}
