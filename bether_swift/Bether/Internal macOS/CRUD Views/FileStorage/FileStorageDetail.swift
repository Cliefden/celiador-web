import SwiftUI
import Supabasable
import OptionalHelpers

struct FileStorageDetail: View {
    var item: FileStorage
    @State var user: Profile?
    @State var creator: Profile?
    @State var project: Project?
    
    var body: some View {
        VStack(alignment: .leading) {
            FileStorageCard(item: item)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // File Information Section
                    VStack(alignment: .leading) {
                        Text("File Information")
                            .font(.headline)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            InfoRow(label: "Name", value: item.name)
                            InfoRow(label: "Path", value: item.path)
                            InfoRow(label: "Size", value: item.formattedSize)
                            InfoRow(label: "Type", value: item.mimeType)
                            InfoRow(label: "Extension", value: item.fileExtension)
                            InfoRow(label: "Created", value: item.formattedDate)
                            InfoRow(label: "Bucket", value: item.bucketName)
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                    }
                    
                    // File Type Information
                    VStack(alignment: .leading) {
                        Text("File Type")
                            .font(.headline)
                        
                        HStack {
                            Image(systemName: item.fileTypeIcon)
                                .foregroundColor(.blue)
                            Text(fileTypeDescription)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                    }
                    
                    // Related Entities
                    if let user = user {
                        VStack(alignment: .leading) {
                            Text("Owner")
                                .font(.headline)
                            
                            ProfileCard(item: user)
                        }
                    }
                    
                    if let creator = creator {
                        VStack(alignment: .leading) {
                            Text("Creator")
                                .font(.headline)
                            
                            ProfileCard(item: creator)
                        }
                    }
                    
                    if let project = project {
                        VStack(alignment: .leading) {
                            Text("Project")
                                .font(.headline)
                            
                            ProjectCard(item: project)
                        }
                    }
                }
                .padding()
            }
        }
        .padding()
        .onFirstAppear {
            if let userId = item.userId {
                Task {
                    let profiles = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: userId)
                    user = profiles.first
                }
            }
            
            if let creatorId = item.creator {
                Task {
                    let profiles = await SBTableManager<Profile>.fetchWithReference(idName: "id", id: creatorId)
                    creator = profiles.first
                }
            }
            
            if let projectId = item.projectId {
                Task {
                    let projects = await SBTableManager<Project>.fetchWithReference(idName: "id", id: projectId)
                    project = projects.first
                }
            }
        }
    }
    
    private var fileTypeDescription: String {
        if item.isImage { return "Image File" }
        if item.isVideo { return "Video File" }
        if item.isAudio { return "Audio File" }
        if item.isDocument { return "Document" }
        if item.isCode { return "Source Code" }
        if item.isArchive { return "Archive" }
        return "Unknown File Type"
    }
}

struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .fontWeight(.medium)
                .frame(width: 80, alignment: .leading)
            Text(value)
                .foregroundColor(.secondary)
            Spacer()
        }
    }
}

#Preview {
    FileStorageDetail(item: FileStorage(
        id: UUID(),
        createdAt: Date(),
        creator: nil,
        name: "example.js",
        path: "projects/123/example.js",
        size: 1024,
        mimeType: "application/javascript",
        bucketName: "project-files",
        userId: nil,
        projectId: nil
    ))
}
