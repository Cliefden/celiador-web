//
//  ProfileView.swift
//  Husbonden2
//
//  Created by Stefan Crafoord-Wiklund on 2025-05-18.
//


import SwiftUI
import Supabasable

struct ProfileView: View {
    @Environment(SBAuthViewModel.self) var auth
    
    var body: some View {
        VStack {
            switch auth.authState {
            case .loading:
                ProgressView()
            case .authenticated:
                LoggedInView()
            case .unauthenticated:
                NewLoginView()
            case .anonymous:
                Text("Anonymous")
            }
        }
        .task {
            await auth.checkLoginStatus()
        }
    }
}

#Preview {
    ProfileView()
}
