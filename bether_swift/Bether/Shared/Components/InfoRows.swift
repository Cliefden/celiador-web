//
//  InfoRows.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import SwiftUI

struct InfoRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack(spacing: 4) {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(value.isEmpty ? "Not provided" : value)
                .font(.body)
        }
    }
}

struct InfoRow2: View {
    let label: String
    let value: String
    let icon: String
    var valueColor: Color = .primary
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.body)
                .foregroundColor(.blue)
                .frame(width: 20)
            
            Text(label)
                .font(.body)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(valueColor)
        }
    }
}

struct DateInfoRow: View {
    let title: String
    let date: Date?
    
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter
    }()
    
    var body: some View {
        HStack {
            Text(title)
                .foregroundColor(.gray)
            Spacer()
            Text(date.map { dateFormatter.string(from: $0) } ?? "Not set")
                .foregroundColor(date == nil ? .gray : .primary)
                .bold()
        }
    }
}

struct CurrencyInfoRow: View {
    let title: String
    let amount: Double
    
    var body: some View {
        HStack {
            Text(title)
                .foregroundColor(.gray)
            Spacer()
            Text(amount, format: .currency(code: "SEK"))
                .bold()
        }
    }
}
