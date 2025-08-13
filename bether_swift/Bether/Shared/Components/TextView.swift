//
//  TextView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI

struct TextView: View {
    let text: String
    var textUnit: String? = nil
    var textUnitColor: Color? = .accentColor
    var textStyle: HierarchicalShapeStyle
    
    var body: some View {
        HStack(spacing: 5) {
            Text(text)
            if let textUnit {
                Text(textUnit)
                    .foregroundColor(textUnitColor)
            }
        }
        .foregroundStyle(textStyle)
        .bold()
    }
}

#Preview {
    TextView(text: "Stefan", textUnit: "SEK", textUnitColor: .blue, textStyle: .primary)
}
