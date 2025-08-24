import SwiftUI
import UniformTypeIdentifiers
import OptionalHelpers

struct FileStorageAddOrEdit: View {
    let itemToEdit: FileStorage?
    @Environment(\.dismiss) private var dismiss
    
    @State private var name: String = ""
    @State private var path: String = ""
    @State private var mimeType: String = ""
    @State private var bucketName: String = "project-files"
    @State private var selectedProject: Project?
    @State private var projects: [Project] = []
    @State private var isUploading = false
    @State private var selectedFileURL: URL?
    @State private var showingFilePicker = false
    
    var body: some View {
        VStack {
            // Header
            HStack {
                Text(itemToEdit == nil ? "Add File" : "Edit File")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("Cancel") {
                    dismiss()
                }
                .buttonStyle(.bordered)
                
                Button("Save") {
                    saveFile()
                }
                .buttonStyle(.borderedProminent)
                .disabled(name.isEmpty || path.isEmpty || isUploading)
            }
            .padding()
            
            // Form content
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
                            Text(project.name ?? "Unnamed Project").tag(project as Project?)
                        }
                    }
                }
                
                Section("File Upload") {
                    Button(action: selectFile) {
                        HStack {
                            Image(systemName: "doc.badge.plus")
                            Text(selectedFileURL != nil ? "File Selected: \(selectedFileURL?.lastPathComponent ?? "")" : "Select File to Upload")
                        }
                    }
                    .disabled(isUploading)
                    
                    if let selectedFileURL = selectedFileURL {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Selected File:")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(selectedFileURL.lastPathComponent)
                                .font(.caption)
                                .foregroundColor(.primary)
                        }
                        .padding(.vertical, 4)
                    }
                    
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
        }
        .onAppear {
            loadData()
        }
        .fileImporter(
            isPresented: $showingFilePicker,
            allowedContentTypes: [.data],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                if let url = urls.first {
                    selectedFileURL = url
                    name = url.lastPathComponent
                    path = "\(selectedProject?.id.uW.uuidString ?? "unknown")/\(url.lastPathComponent)"
                    mimeType = getMimeType(for: url)
                }
            case .failure(let error):
                print("File selection failed: \(error)")
            }
        }
    }
    
    private func loadData() {
        if let item = itemToEdit {
            name = item.name
            path = item.path
            mimeType = item.mimeType ?? ""
            bucketName = item.bucketName
        }
        
        Task {
            await loadProjects()
        }
    }
    
    private func loadProjects() async {
        // Fetch projects from Supabase
        guard let url = URL(string: "\(SupabaseConfig.url)/rest/v1/projects?select=*") else {
            print("Invalid URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(Secrets.adminAPIKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("*", forHTTPHeaderField: "Prefer")
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("Invalid response type")
                return
            }
            
            print("Response status: \(httpResponse.statusCode)")
            print("Response headers: \(httpResponse.allHeaderFields)")
            
            if httpResponse.statusCode == 200 {
                do {
                    let projects = try JSONDecoder().decode([Project].self, from: data)
                    await MainActor.run {
                        self.projects = projects
                        print("Loaded \(projects.count) projects")
                    }
                } catch {
                    print("Failed to decode projects: \(error)")
                    if let responseString = String(data: data, encoding: .utf8) {
                        print("Response data: \(responseString)")
                    }
                }
            } else {
                print("HTTP Error: \(httpResponse.statusCode)")
                if let responseString = String(data: data, encoding: .utf8) {
                    print("Error response: \(responseString)")
                }
            }
        } catch {
            print("Failed to fetch projects: \(error)")
        }
    }
    
    private func selectFile() {
        showingFilePicker = true
    }
    
    private func uploadFile(from url: URL) async -> FileStorage? {
        do {
            let uploadedFile = await FileStorageManager.shared.uploadFile(
                fileURL: url,
                name: name,
                path: path,
                projectId: selectedProject?.id
            )
            return uploadedFile
        } catch {
            print("Error uploading file: \(error)")
            return nil
        }
    }
    
    private func saveFile() {
        guard let selectedFileURL = selectedFileURL else {
            // Handle case where no file is selected
            return
        }
        
        isUploading = true
        
        Task {
            let uploadedFile = await uploadFile(from: selectedFileURL)
            
            await MainActor.run {
                isUploading = false
                if uploadedFile != nil {
                    dismiss()
                }
            }
        }
    }
    
    private func getMimeType(for url: URL) -> String {
        let pathExtension = url.pathExtension.lowercased()
        
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
        
        return mimeTypes[pathExtension] ?? "application/octet-stream"
    }
}

#Preview {
    FileStorageAddOrEdit(itemToEdit: nil)
}

