//
//  JobDetail.swift
//  Internal macOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-14.
//

import SwiftUI
import Supabasable

struct JobDetail: View {
    var item: Job
    var body: some View {
        VStack(alignment: .leading) {
            JobCard(item: item)
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
