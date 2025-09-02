//
//  MessageBubble.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-31.
//

import SwiftUI

struct MessageBubble: View {
    let message: ClaudeMessage
    
    var body: some View {
        HStack {
            if message.role == "user" {
                Spacer()
            }
            
            VStack(alignment: message.role == "user" ? .trailing : .leading, spacing: 4) {
                Text(message.content ?? "")
                    .font(.body)
                    .foregroundColor(message.role == "user" ? .white : .primary)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(message.role == "user" ? Color.purple : Color(.systemGray5))
                    )
                
                Text((message.createdAt ?? Date()).formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity * 0.8, alignment: message.role == "user" ? .trailing : .leading)
            
            if message.role == "assistant" {
                Spacer()
            }
        }
    }
}
