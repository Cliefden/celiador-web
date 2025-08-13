//
//  IconMaker.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI

struct IconMaker: View {
    let icon: String
    var bgColor: Color = .green
    var size: Int = 64
    var active: Bool = true
    var body: some View {
        Image(systemName: icon)
            .font(.system(size: CGFloat(size) / 1.5))
            .foregroundStyle(.white)
            .frame(width: CGFloat(size), height: CGFloat(size))
            .background(bgColor.gradient.opacity(active ? 1 : 0.5))
            .clipShape(RoundedRectangle(cornerRadius: CGFloat(size) / 5))
    }
}
