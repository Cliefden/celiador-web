import SwiftUI

struct FileStorageDetail: View {
    let file: FileStorage
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Main file card
                FileStorageCard(
                    file: file,
                    onEdit: {
                        // Edit functionality would be handled by parent
                    },
                    onDelete: {
                        // Delete functionality would be handled by parent
                    }
                )
                
                // File Information Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("File Information")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    VStack(spacing: 8) {
                        InfoRow(title: "File Name", value: file.name)
                        InfoRow(title: "Path", value: file.path)
                        InfoRow(title: "Size", value: file.formattedSize)
                        InfoRow(title: "Type", value: file.fileTypeDescription)
                        if let mimeType = file.mimeType {
                            InfoRow(title: "MIME Type", value: mimeType)
                        }
                        InfoRow(title: "Bucket", value: file.bucketName)
                        InfoRow(title: "Created", value: file.formattedDate)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(8)
                
                // File Type Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("File Type")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    HStack {
                        Image(systemName: file.fileTypeIcon)
                            .foregroundColor(file.isDirectory ? .orange : .blue)
                            .font(.title2)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(file.fileTypeDescription)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            Text("Extension: .\(file.fileExtension)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(8)
                }
                
                // Actions Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("Actions")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    HStack(spacing: 12) {
                        Button(action: downloadFile) {
                            HStack {
                                Image(systemName: "arrow.down.circle")
                                Text("Download")
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.blue.opacity(0.1))
                            .foregroundColor(.blue)
                            .cornerRadius(6)
                        }
                        
                        Button(action: shareFile) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Share")
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.green.opacity(0.1))
                            .foregroundColor(.green)
                            .cornerRadius(6)
                        }
                        
                        Spacer()
                    }
                }
                
                // Related Project Section (if applicable)
                if let projectId = file.projectId {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Related Project")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        HStack {
                            Image(systemName: "folder")
                                .foregroundColor(.blue)
                                .font(.title2)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Project ID: \(projectId.uuidString.prefix(8))...")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                Text("Click to view project details")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Button("View") {
                                // Navigate to project details
                            }
                            .buttonStyle(.bordered)
                        }
                        .padding()
                        .background(Color.gray.opacity(0.05))
                        .cornerRadius(8)
                    }
                }
            }
            .padding()
        }
    }
    
    private func downloadFile() {
        // Implement file download functionality
        print("Downloading file: \(file.name)")
    }
    
    private func shareFile() {
        // Implement file sharing functionality
        print("Sharing file: \(file.name)")
    }
}

//struct InfoRow: View {
//    let label: String
//    let value: String
//    
//    var body: some View {
//        HStack {
//            Text(label)
//                .font(.subheadline)
//                .fontWeight(.medium)
//                .foregroundColor(.secondary)
//                .frame(width: 80, alignment: .leading)
//            
//            Text(value)
//                .font(.subheadline)
//                .foregroundColor(.primary)
//            
//            Spacer()
//        }
//    }
//}

#Preview {
    FileStorageDetail(
        file: FileStorage(
            id: UUID(),
            createdAt: Date(),
            name: "example.js",
            path: "projects/123/example.js",
            size: 1024,
            mimeType: "application/javascript",
            bucketName: "project-files",
            userId: nil,
            projectId: UUID()
        )
    )
}
