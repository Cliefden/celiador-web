import SwiftUI

struct FileStorageCard: View {
    let file: FileStorage
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    @State private var isDeleting = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with icon and name
            HStack {
                Image(systemName: file.fileTypeIcon)
                    .foregroundColor(file.isDirectory ? .orange : .blue)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(file.name)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text(file.path)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(file.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // File details
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label("Size", systemImage: "externaldrive")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(file.formattedSize)
                        .font(.caption)
                        .foregroundColor(.primary)
                }
                
                HStack {
                    Label("Type", systemImage: "doc")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(file.fileTypeDescription)
                        .font(.caption)
                        .foregroundColor(.primary)
                }
                
                HStack {
                    Label("Bucket", systemImage: "archivebox")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(file.bucketName)
                        .font(.caption)
                        .foregroundColor(.primary)
                }
            }
            
            // Action buttons
            HStack {
                Button(action: onEdit) {
                    HStack {
                        Image(systemName: "pencil")
                        Text("Edit File")
                    }
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(6)
                }
                
                Spacer()
                
                Button(action: deleteFile) {
                    HStack {
                        if isDeleting {
                            ProgressView()
                                .scaleEffect(0.6)
                        } else {
                            Image(systemName: "trash")
                        }
                        Text(isDeleting ? "Deleting..." : "Delete File")
                    }
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.red.opacity(0.1))
                    .foregroundColor(.red)
                    .cornerRadius(6)
                }
                .disabled(isDeleting)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
        )
    }
    
    private func deleteFile() {
        isDeleting = true
        
        Task {
            let success = await FileStorageManager.shared.deleteFile(fileId: file.id)
            
            await MainActor.run {
                isDeleting = false
                if success {
                    onDelete()
                }
            }
        }
    }
}

#Preview {
    FileStorageCard(
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
        ),
        onEdit: {},
        onDelete: {}
    )
    .padding()
}
