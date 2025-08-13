//
//  Internal_macOSApp.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import SwiftUI
import Supabasable

@main
struct Internal_macOSApp: App {
    
    @State private var authViewModel = SBAuthViewModel()
    
    init() {
        SBManager.setup(
            projectURLString: Secrets.projectURLString,
            apiKey: Secrets.apiKey,
            adminAPIKey: Secrets.adminAPIKey
        )
    }
    
    var body: some Scene {
        WindowGroup("Data View") {
//            CheckLoginStatus {
                DataView()
//                    .environment(individualViewModel)
//            }
//            .environment(authViewModel)
        }
    }
}
