//
//  IntervalView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import OptionalHelpers

struct IntervalView: View {
    let fromWhen: Date?
    let toWhen: Date?
    var withTime: Bool = false
    var fromWhenText: String = "From"
    var toWhenText: String = "To"
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(fromWhenText + ":").bold()
                if toWhen != nil {
                    Text(toWhenText + ":").bold()
                } else {
                    Spacer()
                }
            }
            VStack {
                Text(fromWhen.uW.formatted(date: .numeric, time: withTime ? .shortened : .omitted))
                if let toWhen {
                    Text(toWhen.formatted(date: .numeric, time: withTime ? .shortened : .omitted))
                } else {
                    Spacer()
                }
            }
        }
        .frame(height: toWhen != nil ? 50 : 30)
    }
}

#Preview {
        IntervalView(fromWhen: Date.now, toWhen: Date.now)
}

#Preview {
    IntervalView(fromWhen: .now, toWhen: .distantFuture)
}
