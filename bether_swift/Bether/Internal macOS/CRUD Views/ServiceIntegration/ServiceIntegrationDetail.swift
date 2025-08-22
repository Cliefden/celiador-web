//
//  ServiceIntegrationDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import Supabasable

struct ServiceIntegrationDetail: View {
    var item: ServiceIntegration
    @State var user: Profile?
    
    var body: some View {
        VStack(alignment: .leading) {
            ServiceIntegrationCard(item: item)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let user = user {
                        VStack(alignment: .leading) {
                            Text("User")
                                .font(.headline)
                            
                            ProfileCard(item: user)
                        }
                    }
                }
                .padding()
            }
        }
        .padding()
        .onFirstAppear {
            if let userId = item.userId {
                Task {
                    let profiles = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId)
                    user = profiles.first
                }
            }
        }
    }
}
