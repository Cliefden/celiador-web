//
//  CardLeftView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI

struct CardLeftView: View {
    let headerText: String
    
#if os(macOS)
    var image1: NSImage? = nil
    var image2: NSImage? = nil
#elseif os(iOS)
    var image1: UIImage? = nil
    var image2: UIImage? = nil
#endif
    
    var annotations: [MapAddress]? = nil
    
    let mainText: CompoundText
    var secondText: CompoundText? = nil
    var thirdText: CompoundText? = nil
    var fourthText: CompoundText? = nil
    var fifthText: CompoundText? = nil
    var sixthText: CompoundText? = nil
    var seventhText: CompoundText? = nil
    var dates: Dates? = nil
    var date: Date? = nil
    var withTime: Bool = false
    var fromWhenText: String = "From"
    var toWhenText: String = "To"
    
    var body: some View {
        GroupBox {
            HStack {
                if let image1 {
#if os(macOS)
                    Image(nsImage: image1)
                        .resizable()
                        .scaledToFit()
                        .frame(minWidth: 100, minHeight: 100)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .frame(maxWidth: 300)
#elseif os(iOS)
                    Image(uiImage: image1)
                        .resizable()
                        .scaledToFit()
                        .frame(minWidth: 100, minHeight: 100)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .frame(maxWidth: 300)
#endif
                }
                
                if let image2 {
#if os(macOS)
                    Image(nsImage: image2)
                        .resizable()
                        .scaledToFit()
                        .frame(minWidth: 100, minHeight: 100)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .frame(maxWidth: 300)
#elseif os(iOS)
                    Image(uiImage: image2)
                        .resizable()
                        .scaledToFit()
                        .frame(minWidth: 100, minHeight: 100)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .frame(maxWidth: 300)
#endif
                }
                if let annotations {
                    MapView(organisationAnnotations: annotations, individualAnnotations: [])
                }
                
                VStack(alignment: .leading) {
                    Text(headerText)
                        .foregroundStyle(.primary)
                        .bold()
                    TextView(
                        text: mainText.text,
                        textUnit: mainText.unit,
                        textUnitColor: mainText.color,
                        textStyle: .secondary
                    )
                    if let secondText {
                        TextView(
                            text: secondText.text,
                            textUnit: secondText.unit,
                            textUnitColor: secondText.color,
                            textStyle: .secondary
                        )
                    }
                    if let dates {
                        IntervalView(
                            fromWhen: dates.fromWhen,
                            toWhen: dates.toWhen,
                            withTime: withTime,
                            fromWhenText: fromWhenText,
                            toWhenText: toWhenText
                        )
                    }
                    if let date {
                        Text(date.formatted(date: .abbreviated, time: .shortened))
                    }
                    if let thirdText {
                        TextView(
                            text: thirdText.text,
                            textUnit: thirdText.unit,
                            textUnitColor: thirdText.color,
                            textStyle: .secondary
                        )
                    }
                    if let fourthText {
                        TextView(
                            text: fourthText.text,
                            textUnit: fourthText.unit,
                            textUnitColor: fourthText.color,
                            textStyle: .secondary
                        )
                    }
                    if let fifthText {
                        TextView(
                            text: fifthText.text,
                            textUnit: fifthText.unit,
                            textUnitColor: fifthText.color,
                            textStyle: .secondary
                        )
                    }
                    if let sixthText {
                        TextView(
                            text: sixthText.text,
                            textUnit: sixthText.unit,
                            textUnitColor: sixthText.color,
                            textStyle: .secondary
                        )
                    }
                    if let seventhText {
                        TextView(
                            text: seventhText.text,
                            textUnit: seventhText.unit,
                            textUnitColor: seventhText.color,
                            textStyle: .secondary
                        )
                    }
                    Spacer()
                }
                Spacer()
            }.frame(minWidth: /*@START_MENU_TOKEN@*/0/*@END_MENU_TOKEN@*/, maxWidth: .infinity)
        }
    }
}
