//
//  LogEntryView.swift
//  Bether
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import SwiftUI

struct LogEntryView: View {
    let log: LogEntry
    
    var body: some View {
        HStack(alignment: .top) {
            Text(log.timestamp, formatter: logTimeFormatter)
                .font(.caption2)
                .foregroundColor(.secondary)
                .frame(width: 60, alignment: .leading)
            
            Text(log.message)
                .font(.caption)
                .foregroundColor(log.level.color)
            
            Spacer()
        }
    }
}

private let logTimeFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.timeStyle = .short
    return formatter
}()
