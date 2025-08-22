//
//  GitHubIntegrationDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-22.
//

import SwiftUI
import Supabasable

struct GitHubIntegrationDetail: View {
    var item: GitHubIntegration
    var body: some View {
        VStack(alignment: .leading) {
            GitHubIntegrationCard(item: item)
        }
        .padding()
    }
}
