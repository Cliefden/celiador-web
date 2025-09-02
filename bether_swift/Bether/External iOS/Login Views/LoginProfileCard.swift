//
//  LoginProfileCard.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-09-02.
//

import SwiftUI
import Supabasable

struct LoginProfileCard: View {
    @Environment(SBProfileViewModel.self) var profile
    
    var body: some View {
        CardContainer {
            CardHeader()
            CardContent()
            CardFooter()
        }
        .task {
            await profile.getProfile()
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
        VStack(alignment: .leading, spacing: 16) {
            InfoRow(title: "Namn", value: profile.fullName)
            InfoRow(title: "Email", value: profile.email)
//            InfoRow(title: "Role", value: individual.userRole.rawValue)
//            InfoRow(title: "Personnummer", value: profile.personalId)
//            InfoRow(title: "Mobil", value: profile.phoneNumber)
        }
    }
    
    func CardFooter() -> some View {
        Text("If you want any of this info changed contact us at info@celiador.ai")
            .font(.caption2)
            .foregroundColor(.gray)
            .multilineTextAlignment(.leading)
    }
}
