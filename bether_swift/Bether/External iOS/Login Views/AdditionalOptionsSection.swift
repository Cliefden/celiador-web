//
//  AdditionalOptionsSection.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-07.
//

import SwiftUI

struct AdditionalOptionsSection: View {
    var body: some View {
        VStack(spacing: 20) {
            // Social Login Options (if needed)
            VStack(spacing: 16) {
                Text("Quick Access")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                HStack(spacing: 16) {
                    Button(action: {
                        // Handle demo access
                    }) {
                        HStack {
                            Image(systemName: "play.circle")
                            Text("Try Demo")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(.systemGray4), lineWidth: 1)
                        )
                    }
                    .foregroundColor(.primary)
                    
                    Button(action: {
                        // Handle contact sales
                    }) {
                        HStack {
                            Image(systemName: "phone")
                            Text("Get Started")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(.systemGray4), lineWidth: 1)
                        )
                    }
                    .foregroundColor(.primary)
                }
            }
            .padding(.horizontal, 20)
        }
    }
}
