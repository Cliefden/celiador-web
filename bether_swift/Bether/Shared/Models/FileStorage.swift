import Foundation
import Supabasable

struct FileStorage: SBTable, SBListable, SBTypeNameable, SBManageable, Hashable, Named {
    let id: UUID
    let createdAt: Date
    let creator: reference?
    let name: String
    let path: String
    let size: Int64
    let mimeType: String
    let bucketName: String
    let userId: reference?
    let projectId: reference?
    
    // Computed properties
    var displayName: String {
        return name
    }
    
    var fileExtension: String {
        return (name as NSString).pathExtension.lowercased()
    }
    
    var isImage: Bool {
        return ["jpg", "jpeg", "png", "gif", "webp", "svg"].contains(fileExtension)
    }
    
    var isVideo: Bool {
        return ["mp4", "avi", "mov", "wmv", "flv", "webm"].contains(fileExtension)
    }
    
    var isAudio: Bool {
        return ["mp3", "wav", "aac", "flac", "ogg"].contains(fileExtension)
    }
    
    var isDocument: Bool {
        return ["pdf", "doc", "docx", "txt", "rtf"].contains(fileExtension)
    }
    
    var isCode: Bool {
        return ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "h", "swift", "kt", "rs", "go", "php", "rb", "cs", "html", "css", "scss", "sass", "json", "xml", "yaml", "yml", "md", "sql"].contains(fileExtension)
    }
    
    var isArchive: Bool {
        return ["zip", "rar", "7z", "tar", "gz"].contains(fileExtension)
    }
    
    var fileTypeIcon: String {
        if isImage { return "photo" }
        if isVideo { return "video" }
        if isAudio { return "music.note" }
        if isDocument { return "doc.text" }
        if isCode { return "chevron.left.forwardslash.chevron.right" }
        if isArchive { return "archivebox" }
        return "doc"
    }
    
    var formattedSize: String {
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
extension SBTableManager where T == FileStorage {
    static func fetchFilesByProject(_ projectId: UUID) async -> [FileStorage] {
        // This would need to be implemented to fetch files from Supabase storage
        // For now, returning empty array as placeholder
        return []
    }
    
    static func fetchFilesByUser(_ userId: UUID) async -> [FileStorage] {
        // This would need to be implemented to fetch files from Supabase storage
        // For now, returning empty array as placeholder
        return []
    }
    
    static func uploadFile(_ fileData: Data, fileName: String, projectId: UUID, userId: UUID) async -> FileStorage? {
        // This would need to be implemented to upload files to Supabase storage
        // For now, returning nil as placeholder
        return nil
    }
    
    static func deleteFile(_ fileId: UUID) async -> Bool {
        // This would need to be implemented to delete files from Supabase storage
        // For now, returning false as placeholder
        return false
    }
}
