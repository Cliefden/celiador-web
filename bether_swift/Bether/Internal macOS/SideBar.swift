//
//  SideBar.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import SwiftUI

struct SideBar: View {
    var body: some View {
        List {
            NavigationLink("Projects") {
                NamedEntityList(
                    detailView: { AnyView(ProjectDetail(item: $0)) },
                    editView: { AnyView(ProjectAddOrEdit(itemToEdit: $0)) }
                )
            }
        }
    }
}

#Preview {
    SideBar()
}
