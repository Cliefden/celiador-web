//
//  DataView.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI

struct DataView: View {
    var body: some View {
        NavigationView {
            SideBar()
            ContentUnavailableView("Nothing selected", systemImage: "pencil.slash")
            ContentUnavailableView("Nothing selected", systemImage: "pencil.slash")
        }
        .listStyle(.plain)
    }
}
