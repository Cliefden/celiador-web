//
//  ProjectDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import SwiftUI
import Supabasable

struct ProjectDetail: View {
    var item: Project
    var body: some View {
        VStack(alignment: .leading) {
            ProjectCard(item: item)
//            ScrollView {
//                ForEach(vm.items) { item in
//                    CountryCard(item: item)
//                }
//            }
//            .padding()
//            .onFirstAppear {
//                vm.addListener(idName: type(of: item).idName, id: item.id.uW)
//            }
//            .onDisappear {
//                vm.cancelListener()
//            }
        }
        .padding()
    }
}
