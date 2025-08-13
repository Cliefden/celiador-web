//
//  ListRowView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//


import SwiftUI
import Supabasable

struct ListRowView: View {
    let icon: String
    var color: Color = .green
    var active = true
    let firstLeadingText: String
    var secondLeadingText: String? = nil
    let firstTrailingText: String
    var secondTrailingText: String? = nil
    var body: some View {
        HStack {
            IconMaker(icon: icon, bgColor: color, size: 50, active: active)
            VStack(alignment: .leading) {
                Text(firstLeadingText)
                    .font(.headline)
                    .bold()
                if let secondLeadingText {
                    Text(secondLeadingText)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text(firstTrailingText)
                if let secondTrailingText {
                    Text(secondTrailingText)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}
