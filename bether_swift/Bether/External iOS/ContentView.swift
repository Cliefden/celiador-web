//
//  ContentView.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-29.
//

import SwiftUI
import Supabasable

struct ContentView: View {
    @Environment(SBAuthViewModel.self) var auth
    var body: some View {
        Group {
            if auth.isLoading {
                ProgressView()
            } else {
                AppTabView()
            }
        }
        .task {
            await auth.checkLoginStatus()
        }
        
    }
}

#Preview {
    ContentView()
}
