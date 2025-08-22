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
    var body: some View {
        VStack(alignment: .leading) {
            ServiceIntegrationCard(item: item)
        }
        .padding()
    }
}
