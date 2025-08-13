//
//  CardRightView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import Supabasable

struct CardRightView: View {
    let timeStamp: Date?
    
    var creator: reference? = nil
    
    var firstButton: CompoundButton? = nil
    var secondButton: CompoundButton? = nil
    var thirdButton: CompoundButton? = nil
    
    var body: some View {
        GroupBox {
            HStack {
                Spacer()
                VStack(alignment: .trailing) {
                    CreatedView(timeStamp: timeStamp, creator: creator)
                    if let firstButton {
                        Button {
                            firstButton.function()
                        } label: {
                            Text(firstButton.text)
                        }
                    }
                    
                    if let secondButton {
                        Button {
                            secondButton.function()
                        } label: {
                            Text(secondButton.text)
                        }
                    }
                    
                    if let thirdButton {
                        Button {
                            thirdButton.function()
                        } label: {
                            Text(thirdButton.text)
                        }
                    }
                    Spacer()
                }
            }.frame(minWidth: /*@START_MENU_TOKEN@*/0/*@END_MENU_TOKEN@*/, maxWidth: .infinity)
        }
    }
}
