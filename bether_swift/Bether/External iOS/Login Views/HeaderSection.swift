//
//  HeaderSection.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-07.
//

import SwiftUI
struct HeaderSection: View {
    var body: some View {
        VStack(spacing: 24) {
            // Logo/Brand Section
            VStack(spacing: 16) {
                Circle()
                    .fill(Color.blue.opacity(0.1))
                    .frame(width: 80, height: 80)
                    .overlay(
                        Image(systemName: "brain")
                            .font(.system(size: 40))
                            .foregroundColor(.blue)
                    )
                
                Text("Welcome Back")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text("Sign in to your Celiador account to continue")
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 40)
            .padding(.horizontal, 20)
        }
    }
}
