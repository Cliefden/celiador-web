//
//  Job.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-12.
//

import Foundation
import SwiftUI
import Supabasable
import Naming


typealias jobID = reference

/// Structured metadata for job results
struct JobMetadata: Codable, Hashable {
    // LLM/Code Generation
    var llmGenerated: Bool?
    var filesModified: [String]?
    var llmError: String?
    var prompt: String?
    var testFile: String?
    var projectDir: String?
    
    // File Storage
    var filesUploaded: Int?
    var storageLocation: String?
    
    // Job Execution
    var error: String?
    var exitCode: Int?
    var deployed: Bool?
    
    // Custom properties (for future extensibility)
    var custom: [String: String]?
}

struct Job:
    SBTable,
    SBListable,
    SBTypeNameable,
    SBManageable,
    Hashable,
    HasStatus,
    Named
{
    static let path = "jobs"
    static let idName = String(typeName.lowercased()) + "_id"
    static let typeName = "Job"
    static let icon = "gear.circle"
    static let color: ModelColor = .orange
    
    var id: reference?
    var createdAt: Date?
    var creator: profileID?
    var updater: profileID?
    var updatedAt: Date?
    var deleter: profileID?
    var deletedAt: Date?
    
    var type: String?
    var status: String?
    var prompt: String?
    var output: String?
    var error: String?
    var metadata: JobMetadata?
    var projectId: reference?
    var userId: reference?
    
    enum CodingKeys: String, CodingKey {
        case id
        case createdAt = "createdat"
        case creator
        case updater
        case updatedAt = "updatedat"
        case deleter
        case deletedAt = "deletedat"
        
        case type
        case status
        case prompt
        case output
        case error
        case metadata
        case projectId = "projectid"
        case userId = "userid"
    }
    
    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Job, rhs: Job) -> Bool {
        return lhs.id == rhs.id
    }
    
    var name: String? {
        return prompt
    }
}
