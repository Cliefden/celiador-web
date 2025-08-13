//
//  ActionButtons.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI

struct ActionButtons: View {
    let isEditEnabled: Bool
    let onEdit: () -> Void
    let onAdd: () -> Void
    
    var body: some View {
        HStack(spacing: 8) {
            Button("Edit", action: onEdit)
                .disabled(!isEditEnabled)
                .keyboardShortcut("e", modifiers: .command)
                .help("Edit the selected item")
            
            Button(action: onAdd) {
                Image(systemName: "plus")
            }
            .keyboardShortcut("n", modifiers: .command)
            .help("Add a new item")
            Spacer()
        }
        .controlSize(.large)
        .padding(.top, 4)
        .padding(.horizontal)
    }
}
