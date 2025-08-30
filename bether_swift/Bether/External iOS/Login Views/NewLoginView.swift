//
//  LoginView.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-01-30.
//

import SwiftUI
import AuthenticationServices
import Supabasable

struct NewLoginView: View {
    @Environment(SBAuthViewModel.self) var auth
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        @Bindable var auth = auth
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Header Section
                    HeaderSection()
                    
                    // Form Section
                    LoginFormSection()
                    
                    // Additional Options
                    AdditionalOptionsSection()
                    
                    Spacer(minLength: 40)
                }
            }
            .background(
                LinearGradient(
                    colors: [Color.blue.opacity(0.05), Color.green.opacity(0.05)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(trailing: Button("Cancel") {
                dismiss()
            })
            
        }
        
    }
}

