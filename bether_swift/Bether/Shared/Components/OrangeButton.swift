//
//  OrangeButton.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-22.
//

import SwiftUI

struct OrangeButton: View {
    
    public enum Way {
        case enter
        case exit
    }
    var way: Way = .enter
    
    let text: String
    var body: some View {
        HStack {
            Image(systemName: way == .exit ? "rectangle.portrait.and.arrow.right" : "arrow.forward.circle")
            .font(.system(size: 16, weight: .medium))
        Text(text)
            .font(.system(size: 14, weight: .medium))
    }
    .foregroundColor(.white)
    .frame(maxWidth: .infinity)
    .padding(.vertical, 12)
    .background(
        LinearGradient(
            gradient: Gradient(colors: [
                Color.red.opacity(0.7),
                Color.orange.opacity(0.7)
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    )
    .clipShape(RoundedRectangle(cornerRadius: 12))
    .shadow(color: .black.opacity(0.1), radius: 5, y: 2)
    }
}

#Preview {
    OrangeButton(text: "Hello, World!")
}
