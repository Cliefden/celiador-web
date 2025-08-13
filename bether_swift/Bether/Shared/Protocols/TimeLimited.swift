//
//  TimeLimited.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import Foundation
import OptionalHelpers

protocol TimeLimited {
    var fromWhen: Date? { get }
    var toWhen: Date? { get }
}

extension TimeLimited {

    var wFromWhen: Date {
        fromWhen.uW //.justAfterMidNight
    }
    
    var wToWhen: Date {
        toWhen.uW //.justBeforeMidnight
    }
    
    var datesString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let start = formatter.string(from: wFromWhen)

        if let endDate = toWhen {
            let end = formatter.string(from: endDate)
            return start + " - " + end
        } else {
            return start + " -"
        }
     }
    
    var howLong: TimeInterval? {
        if let toWhen = toWhen {
            return wFromWhen.timeIntervalSince(toWhen)
        } else {
            return nil
        }
    }
    
    var days: Int? {
        let cal = Calendar.current
        if let endDate = toWhen {
            return cal.dateComponents([.day], from: wFromWhen, to: endDate).day
        } else {
            return cal.dateComponents([.day], from: wFromWhen, to: Date()).day
        }
    }
}
