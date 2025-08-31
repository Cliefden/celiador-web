//
//  AppTabView.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-29.
//

import SwiftUI
import Supabasable

struct AppTabView: View {
    @Environment(SBAuthViewModel.self) var auth
    @State private var selectedDashboardTab: String = "Projects"
    @State private var selectedTab: String = "LandingPage"

    var body: some View {
        Group {
            if auth.authState == .authenticated {
                // Authenticated tabs
                TabView(selection: $selectedDashboardTab) {
                    // Projects: adds a plus button via extraToolbar
                    StackedTab { ProjectsView() }
                    .tabItem {
                        Image(systemName: "folder")
                        Text("Projects")
                    }
                    .tag("Projects")

                    StackedTab { TemplatesView() }
                        .tabItem {
                            Image(systemName: "star")
                            Text("Templates")
                        }
                        .tag("Templates")

                    StackedTab { ActivityView() }
                        .tabItem {
                            Image(systemName: "clock")
                            Text("Activity")
                        }
                        .tag("Activity")

                    StackedTab { ClaudeCodeView() }
                        .tabItem {
                            Image(systemName: "brain.head.profile")
                            Text("Claude Code")
                        }
                        .tag("ClaudeCode")

                    StackedTab { DashboardProfileView() }
                        .tabItem {
                            Image(systemName: "person.crop.circle")
                            Text("Profile")
                        }
                        .tag("Profile")
                }
            } else {
                // Unauthenticated tabs
                TabView(selection: $selectedTab) {
                    StackedTab { LandingPage() }
                        .tabItem {
                            Image(systemName: "house")
                            Text("Home")
                        }
                        .tag("LandingPage")

                    StackedTab { SolutionsView() }
                        .tabItem {
                            Image(systemName: "doc.text")
                            Text("Solutions")
                        }
                        .tag("Solutions")

                    StackedTab { AboutView() }
                        .tabItem {
                            Image(systemName: "info.circle")
                            Text("About")
                        }
                        .tag("About")

                    StackedTab { TemplatesView() }
                        .tabItem {
                            Image(systemName: "star")
                            Text("Templates")
                        }
                        .tag("Templates")

                    StackedTab { ContactView() }
                        .tabItem {
                            Image(systemName: "envelope")
                            Text("Contact")
                        }
                        .tag("Contact")
                }
            }
        }
        // Recreate the whole tab tree when auth flips to avoid stale stacks/sheets
        .id(auth.authState)
    }
}
