//
//  SortOption.swift
//  Internal macOS
//
//  Created by Claude on 2025-01-14.
//

import Foundation

enum SortOption: String, CaseIterable {
    case name = "Name"
    case activityScore = "Activity Score"
    case totalProjects = "Projects"
    case totalJobs = "Jobs"
    case lastActive = "Last Active"
    case joinDate = "Join Date"
}