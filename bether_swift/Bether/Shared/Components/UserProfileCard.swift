//
//  UserProfileCard.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import Supabasable

struct UserProfileCard: View {
    
    @Environment(SBProfileViewModel.self) var profile
    @Environment(SBAuthViewModel.self) var auth
    
    var body: some View {
        CardContainer {
            CardHeader()
            CardContent()
            CardFooter()
        }
        .task {
            // Ensure profile is loaded before trying to get individual
            if profile.id == nil {
                await profile.getProfile()
            }
            
        }
    }

// MARK: - Component Views
    func CardContainer<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            content()
        }
        .padding()
        #if os(macOS)
        .background(Color(.textBackgroundColor))
        #endif
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    func CardHeader() -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Information")
                .font(.title2)
                .fontWeight(.bold)
            
            Divider()
        }
    }
    
    func CardContent() -> some View {
        return VStack(alignment: .leading, spacing: 16) {
            InfoRow(title: "Name", value: profile.fullName)
            InfoRow(title: "Email", value: profile.email)
//            InfoRow(title: "Personnummer", value: profile.personalId)
//            InfoRow(title: "Mobil", value: profile.phoneNumber)
        }
    }
    
    func CardFooter() -> some View {
        Text("If you want any of this info to be changed, please contact info@bether.com")
            .font(.caption2)
            .foregroundColor(.secondary)
            .multilineTextAlignment(.leading)
    }
}
