//
//  LoggedInView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import Supabasable
import PhotosUI

struct LoggedInView: View {
    @Environment(SBAuthViewModel.self) var auth
    @Environment(SBProfileViewModel.self) var profile
    @Environment(\.dismiss) var dismiss
    
    @State private var imageManager = ImageManager(bucket: "avatars")
    
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text("Profile")
                        .font(.largeTitle)
                        .bold()
                        .padding(.top, 20)
                    
                    LoginProfileCard()
                    
                    Button {
                        logOut()
                    } label: {
                        OrangeButton(way: .exit, text: "Sign Out")
                    }
                    .buttonStyle(.borderless)
                }
                .padding(.horizontal, 30)
            }.toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        
        .scrollIndicators(.hidden)
        .task {
            // Ensure profile is loaded before trying to get individual
            if profile.id == nil {
                await profile.getProfile()
            }
            await auth.getUser()
            // Ensure SBIndividualViewModel has a profileID before fetching individual
            
            await imageManager.loadImage(withName: profile.avatarUrl)
        }
    }
    
    func logOut() {
        auth.handleSignOut()
    }
}
