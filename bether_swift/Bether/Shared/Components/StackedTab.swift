//
//  StackedTab.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI
import Supabasable

struct StackedTab<Content: View>: View {
    @Environment(SBAuthViewModel.self) var auth
    @Environment(SBProfileViewModel.self) var profile
    @State private var showProfile = false
    
    let content: Content
    
    init(
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
    }
    
    var body: some View {
        NavigationStack {
            content
                .navigationTitle(!auth.isAuthenticated ? "Celiador" : profile.fullName)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showProfile.toggle() } label: {
                            Image(systemName: "person.crop.circle")
                        }
                    }
                }
        }
        .sheet(isPresented: $showProfile) { ProfileView() }
        .onChange(of: auth.authState) { _, _ in showProfile = false }
    }
}
