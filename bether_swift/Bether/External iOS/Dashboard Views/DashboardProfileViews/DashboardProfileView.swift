//
//  ProfileView.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-29.
//

import SwiftUI
import Supabasable

struct DashboardProfileView: View {
    @Environment(SBAuthViewModel.self) var auth
    @Environment(SBProfileViewModel.self) var profile
    @State private var showingSettings = false
    @State private var showingAbout = false
    
    var body: some View {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    profileHeader
                    
                    // Quick Stats
                    quickStats
                    
                    // Menu Items
                    menuItems
                    
                    // Sign Out Button
                    signOutSection
                }
                .padding()
            }
            .sheet(isPresented: $showingSettings) {
                SettingsSheet()
            }
            .sheet(isPresented: $showingAbout) {
                AboutSheet()
            }
            .task {
                await profile.getProfile()
            }
    }
    
    private var profileHeader: some View {
        VStack(spacing: 16) {
            // Avatar
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 80, height: 80)
                .overlay(
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 40))
                        .foregroundColor(.blue)
                )
            
            VStack(spacing: 4) {
                
                Text(profile.fullName)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                
                Text(auth.userEmail)
                    .font(.title2)
                    .foregroundColor(.primary)
                
                Text("Bether Developer")
                    .font(.body)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.05), Color.purple.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
    }
    
    private var quickStats: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            StatCard(title: "Projects", value: "12", icon: "folder")
            StatCard(title: "Deployed", value: "8", icon: "arrow.up.circle")
            StatCard(title: "Templates", value: "24", icon: "star")
        }
    }
    
    private var menuItems: some View {
        VStack(spacing: 12) {
            MenuRow(icon: "gearshape", title: "Settings", subtitle: "Preferences and account") {
                showingSettings = true
            }
            
            MenuRow(icon: "questionmark.circle", title: "Help & Support", subtitle: "Get help and contact support") {
                // Handle help action
            }
            
            MenuRow(icon: "info.circle", title: "About Bether", subtitle: "Version info and credits") {
                showingAbout = true
            }
            
            MenuRow(icon: "star", title: "Rate Bether", subtitle: "Leave a review on the App Store") {
                // Handle rate action
            }
        }
    }
    
    private var signOutSection: some View {
        VStack(spacing: 16) {
            Button("Sign Out") {
                auth.handleSignOut()
            }
            .font(.headline)
            .foregroundColor(.red)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red.opacity(0.1))
            .cornerRadius(12)
            
            Text("Version 1.0.0")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.top)
    }
}

#Preview {
    DashboardProfileView()
}
