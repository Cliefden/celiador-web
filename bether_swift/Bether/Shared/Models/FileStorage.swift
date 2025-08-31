import Foundation
import SwiftUI
internal import Combine

// MARK: - FileStorage Model
struct FileStorage: Identifiable, Hashable, Codable {
    let id: UUID
    let createdAt: Date
    let name: String
    let path: String
    let size: Int64
    let mimeType: String?
    let bucketName: String
    let userId: UUID?
    let projectId: UUID?
    
    // Computed properties
    var isDirectory: Bool { return mimeType == nil || mimeType?.isEmpty == true }
    var isImage: Bool { return mimeType?.starts(with: "image/") == true }
    var isVideo: Bool { return mimeType?.starts(with: "video/") == true }
    var isAudio: Bool { return mimeType?.starts(with: "audio/") == true }
    var isDocument: Bool { return mimeType?.starts(with: "application/pdf") == true || mimeType?.starts(with: "text/") == true }
    var isCode: Bool { 
        let codeTypes = ["application/javascript", "application/json", "text/html", "text/css", "text/markdown", "application/typescript"]
        return codeTypes.contains(mimeType ?? "")
    }
    var isArchive: Bool { return mimeType?.starts(with: "application/zip") == true || mimeType?.starts(with: "application/x-rar") == true }
    
    var fileExtension: String {
        return URL(fileURLWithPath: name).pathExtension.lowercased()
    }
    
    var fileTypeIcon: String {
        if isDirectory { return "folder" }
        if isImage { return "photo" }
        if isVideo { return "video" }
        if isAudio { return "music.note" }
        if isDocument { return "doc.text" }
        if isCode { return "chevron.left.forwardslash.chevron.right" }
        if isArchive { return "archivebox" }
        return "doc"
    }
    
    var fileTypeDescription: String {
        if isImage { return "Image File" }
        if isVideo { return "Video File" }
        if isAudio { return "Audio File" }
        if isDocument { return "Document" }
        if isCode { return "Source Code" }
        if isArchive { return "Archive" }
        if isDirectory { return "Directory" }
        return "Unknown File Type"
    }
    
    var formattedSize: String {
        if isDirectory { return "" }
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: createdAt)
    }
}

// MARK: - FileStorageManager
class FileStorageManager: ObservableObject {
    static let shared = FileStorageManager()
    
    @Published var files: [FileStorage] = []
    @Published var isLoading = false
    @Published var currentPath = ""
    
    private let supabaseURL = SupabaseConfig.url
    private let supabaseKey = SupabaseConfig.serviceKey // Use service key for server operations
    private let bucketName = SupabaseConfig.bucketName
    
    private init() {}
    
    // MARK: - File Operations
    func loadFiles() {
        isLoading = true
        
        Task {
            await fetchFilesByProject()
            await MainActor.run {
                isLoading = false
            }
        }
    }
    
    func fetchFilesByProject(projectId: UUID? = nil) async {
        // For now, return mock data since we need proper auth setup
        await MainActor.run {
            self.files = [
                FileStorage(
                    id: UUID(),
                    createdAt: Date(),
                    name: "example.js",
                    path: "src/example.js",
                    size: 1024,
                    mimeType: "application/javascript",
                    bucketName: bucketName,
                    userId: UUID(),
                    projectId: projectId
                ),
                FileStorage(
                    id: UUID(),
                    createdAt: Date(),
                    name: "README.md",
                    path: "README.md",
                    size: 512,
                    mimeType: "text/markdown",
                    bucketName: bucketName,
                    userId: UUID(),
                    projectId: projectId
                ),
                FileStorage(
                    id: UUID(),
                    createdAt: Date(),
                    name: "src",
                    path: "src",
                    size: 0,
                    mimeType: nil, // Directory
                    bucketName: bucketName,
                    userId: UUID(),
                    projectId: projectId
                ),
                FileStorage(
                    id: UUID(),
                    createdAt: Date(),
                    name: "package.json",
                    path: "package.json",
                    size: 2048,
                    mimeType: "application/json",
                    bucketName: bucketName,
                    userId: UUID(),
                    projectId: projectId
                ),
                FileStorage(
                    id: UUID(),
                    createdAt: Date(),
                    name: "screenshot.png",
                    path: "assets/screenshot.png",
                    size: 15360,
                    mimeType: "image/png",
                    bucketName: bucketName,
                    userId: UUID(),
                    projectId: projectId
                )
            ]
        }
    }
    
    func fetchFilesByUser(userId: UUID) async -> [FileStorage] {
        // Mock implementation for now
        return []
    }
    
    func uploadFile(fileURL: URL, name: String, path: String, projectId: UUID?) async -> FileStorage? {
        // Mock implementation for now
        let newFile = FileStorage(
            id: UUID(),
            createdAt: Date(),
            name: name,
            path: path,
            size: 0,
            mimeType: "application/octet-stream",
            bucketName: bucketName,
            userId: UUID(),
            projectId: projectId
        )
        
        await MainActor.run {
            self.files.append(newFile)
        }
        
        return newFile
    }
    
    func deleteFile(fileId: UUID) async -> Bool {
        // Mock implementation for now
        await MainActor.run {
            self.files.removeAll { $0.id == fileId }
        }
        return true
    }
    
    // MARK: - Navigation
    func navigateToDirectory(_ path: String) {
        currentPath = path
        loadFiles()
    }
    
    func navigateUp() {
        if !currentPath.isEmpty {
            let components = currentPath.components(separatedBy: "/")
            if components.count > 1 {
                currentPath = components.dropLast().joined(separator: "/")
            } else {
                currentPath = ""
            }
            loadFiles()
        }
    }
}

// MARK: - Supabase Response Models

struct SupabaseFileObject: Codable {
    let name: String
    let bucket_id: String?
    let owner: String?
    let id: String?
    let updated_at: String?
    let created_at: String?
    let last_accessed_at: String?
    let metadata: FileMetadata?
}

struct FileMetadata: Codable {
    let eTag: String?
    let size: Int?
    let mimetype: String?
    let cacheControl: String?
    let lastModified: String?
    let contentLength: Int?
    let httpStatusCode: Int?
    
    enum CodingKeys: String, CodingKey {
        case eTag = "eTag"
        case size = "size"
        case mimetype = "mimetype"
        case cacheControl = "cacheControl"
        case lastModified = "lastModified"
        case contentLength = "contentLength"
        case httpStatusCode = "httpStatusCode"
    }
}
