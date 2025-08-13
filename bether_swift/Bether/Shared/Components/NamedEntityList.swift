//
//  NamedEntityList.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI
import Supabasable
import Naming
import OptionalHelpers

struct NamedEntityList<T: SBTable & SBListable & Named>: View {
    @State private var viewModel: SBTableViewModel<T>
    @State private var isAddItemPresented = false
    @State private var isEditItemPresented = false
    @State private var selectedItem: T?
    
    private let detailView: (T) -> AnyView
    private let editView: (T?) -> AnyView
    private let rowView: ((T) -> AnyView)?
    
    init(
        detailView: @escaping (T) -> AnyView,
        editView: @escaping (T?) -> AnyView,
        rowView: ((T) -> AnyView)? = nil
    ) {
        self.detailView = detailView
        self.editView = editView
        self.rowView = rowView
        _viewModel = State(wrappedValue: SBTableViewModel<T>())
    }
    
    var body: some View {
        let sortedItems = viewModel.items
            .sorted { $0.uWName.lowercased() > $1.uWName.lowercased() }
        
        VStack {
            ActionButtons(
                isEditEnabled: selectedItem != nil,
                onEdit: { isEditItemPresented.toggle() },
                onAdd: { isAddItemPresented.toggle() }
            )
            .sheet(isPresented: $isEditItemPresented) {
                editView(selectedItem)
            }
            .sheet(isPresented: $isAddItemPresented) {
                editView(nil)
            }
            
            List(selection: $selectedItem) {
                ForEach(sortedItems, id: \.self) { item in
                    NavigationLink(
                        destination: detailView(item),
                        label: {
                            if let customLabel = rowView {
                                customLabel(item)
                            } else {
                                ListRowView(
                                    icon: T.icon,
                                    color: T.color.color,
                                    firstLeadingText: item.uWName,
                                    firstTrailingText: item.createdAt.uW.formatted(.relative(presentation: .named))
                                )
                            }
                        }
                    )
                }
            }
        }
        .onFirstAppear {
            viewModel.addListener()
        }
        .onDisappear {
            viewModel.cancelListener()
        }
    }
}
