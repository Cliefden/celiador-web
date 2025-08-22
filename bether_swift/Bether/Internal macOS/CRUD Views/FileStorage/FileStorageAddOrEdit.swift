import SwiftUI
import Supabasable
import OptionalHelpers

struct FileStorageAddOrEdit: View {
    var itemToEdit: FileStorage?
    @Environment(\.dismiss) private var dismiss
    
    @State private var name: String = ""
    @State private var path: String = ""
    @State private var mimeType: String = ""
    @State private var bucketName: String = "project-files"
    @State private var selectedProject: Project?
    @State private var projects: [Project] = []
    @State private var isUploading = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("File Information") {
                    TextField("File Name", text: $name)
                    TextField("Path", text: $path)
                    TextField("MIME Type", text: $mimeType)
                    TextField("Bucket Name", text: $bucketName)
                }
                
                Section("Project") {
                    Picker("Project", selection: $selectedProject) {
                        Text("No Project").tag(nil as Project?)
                        ForEach(projects, id: \.id) { project in
                            Text(project.displayName).tag(project as Project?)
                        }
                    }
                }
                
                Section("File Upload") {
                    Button(action: selectFile) {
                        HStack {
                            Image(systemName: "doc.badge.plus")
                            Text("Select File to Upload")
                        }
                    }
                    .disabled(isUploading)
                    
                    if isUploading {
                        HStack {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Uploading...")
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .navigationTitle(itemToEdit == nil ? "Add File" : "Edit File")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveFile()
                    }
                    .disabled(name.isEmpty || path.isEmpty)
                }
            }
        }
        .onAppear {
            loadData()
        }
    }
    
    private func loadData() {
        if let item = itemToEdit {
            name = item.name
            path = item.path
            mimeType = item.mimeType
            bucketName = item.bucketName
        }
        
        Task {
            await loadProjects()
        }
    }
    
    private func loadProjects() async {
        // Load projects for the picker
        // This would need to be implemented based on your Supabase setup
    }
    
    private func selectFile() {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.allowedContentTypes = [.data]
        
        if panel.runModal() == .OK {
            guard let url = panel.url else { return }
            
            name = url.lastPathComponent
            path = "projects/\(selectedProject?.id.uW ?? UUID())/\(name)"
            mimeType = url.mimeType ?? "application/octet-stream"
            
            uploadFile(from: url)
        }
    }
    
    private func uploadFile(from url: URL) {
        isUploading = true
        
        Task {
            do {
                let fileData = try Data(contentsOf: url)
                let uploadedFile = await SBTableManager<FileStorage>.uploadFile(
                    fileData,
                    fileName: name,
                    projectId: selectedProject?.id.uW ?? UUID(),
                    userId: UUID() // This should be the current user's ID
                )
                
                await MainActor.run {
                    isUploading = false
                    if uploadedFile != nil {
                        dismiss()
                    }
                }
            } catch {
                await MainActor.run {
                    isUploading = false
                    // Handle error
                }
            }
        }
    }
    
    private func saveFile() {
        // Save the file metadata
        // This would need to be implemented based on your Supabase setup
        dismiss()
    }
}

extension URL {
    var mimeType: String? {
        let pathExtension = self.pathExtension.lowercased()
        
        let mimeTypes: [String: String] = [
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "pdf": "application/pdf",
            "txt": "text/plain",
            "js": "application/javascript",
            "ts": "application/typescript",
            "json": "application/json",
            "html": "text/html",
            "css": "text/css",
            "md": "text/markdown",
            "zip": "application/zip",
            "mp4": "video/mp4",
            "mp3": "audio/mpeg"
        ]
        
        return mimeTypes[pathExtension]
    }
}

#Preview {
    FileStorageAddOrEdit(itemToEdit: nil)
}
