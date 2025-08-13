//
//  CardView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import Supabasable

struct CardView<
    ImageView: View,
    LeftSide: View,
    RightSide: View,
    T: SBTable & SBListable & SBTypeNameable
>: View {
    
    let item: T
    
    @ViewBuilder var imageView: ImageView
    @ViewBuilder var leftSide: LeftSide
    @ViewBuilder var rightSide: RightSide
    
    var body: some View {
        GroupBox {
            HStack {
                imageView
                leftSide
                Spacer()
                rightSide
            }
        } label: {
            Label {
                Text(type(of: item).typeName)
            } icon: {
                Image(systemName: type(of: item).icon)
            }
            .bold()
            .foregroundStyle(.green)
        }
    }
}
