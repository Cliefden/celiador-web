//
//  External_iOSApp.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-29.
//

import SwiftUI
import Supabasable

@main
struct External_iOSApp: App {
    
    @State private var authViewModel = SBAuthViewModel()
    @State private var profileViewModel = SBProfileViewModel()
    
    init() {
        SBManager.setup(
            projectURLString: Secrets.projectURLString,
            apiKey: Secrets.apiKey,
            adminAPIKey: Secrets.adminAPIKey
        )
        
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authViewModel)
                .environment(profileViewModel)
        }
    }
}
