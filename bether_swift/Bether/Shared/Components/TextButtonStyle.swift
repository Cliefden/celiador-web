//
//  TextButtonStyle.swift
//  Elsinore
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-07.
//

import SwiftUI

struct TextButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.secondary)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}
