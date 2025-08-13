//
//  MapView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import MapKit

struct MapView: View {
    
    let organisationAnnotations: [MapAddress]
    let individualAnnotations: [MapAddress]
    
//    let stroke = StrokeStyle(
//        lineWidth: 5,
//        lineCap: .round,
//        lineJoin: .round,
//        dash: [10, 10]
//    )
//
//    let gradient = LinearGradient(
//        colors: [.red, .green, .blue],
//        startPoint: .leading,
//        endPoint: .trailing
//    )
    
    var body: some View {
        Map(interactionModes: .all) {
            ForEach(organisationAnnotations) { annotation in
                Marker(annotation.name, coordinate: annotation.coordinate)
            }
        }
        .mapStyle(.imagery(elevation: .realistic))
        .mapControls{
            MapUserLocationButton()
            MapCompass()
        }
        .frame(width: 300, height: 300)
        .shadow(radius: 5)
    }
}
