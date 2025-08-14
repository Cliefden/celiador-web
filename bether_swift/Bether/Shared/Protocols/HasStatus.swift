//
//  HasStatus.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-14.
//
import SwiftUI

protocol HasStatus {
    var status: String? { get }
}

extension HasStatus {
    var statusColor: Color {
        switch status?.lowercased() {
        case "ready":
            return .green
        case "running":
            return .orange
        case "failed":
            return .red
        case "completed":
            return .blue
        default:
            return .secondary
        }
    }
}
