import SwiftUI
import Supabasable
import OptionalHelpers

struct FileBrowser: View {
    @State private var files: [FileStorage] = []
    @State private var isLoading = false
    @State private var searchText = ""
    @State private var selectedProject: Project?
    @State private var projects: [Project] = []
    @State private var currentPath = ""
    @State private var showingUploadSheet = false
    
    var filteredFiles: [FileStorage] {
        if searchText.isEmpty {
            return files
        } else {
            return files.filter { file in
                file.name.localizedCaseInsensitiveContains(searchText) ||
                file.path.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with controls
            VStack(spacing: 12) {
                HStack {
                    Text("Project Files Browser")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Spacer()
                    
                    Button(action: { showingUploadSheet = true }) {
                        HStack {
                            Image(systemName: "plus")
                            Text("Upload File")
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(6)
                    }
                }
                
                // Project selector
                HStack {
                    Text("Project:")
                        .fontWeight(.medium)
                    
                    Picker("Project", selection: $selectedProject) {
                        Text("All Projects").tag(nil as Project?)
                        ForEach(projects, id: \.id) { project in
                            Text(project.displayName).tag(project as Project?)
                        }
                    }
                    .onChange(of: selectedProject) { _ in
                        loadFiles()
                    }
                    
                    Spacer()
                    
                    Button(action: loadFiles) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
                
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    
                    TextField("Search files...", text: $searchText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                // Breadcrumb
                if !currentPath.isEmpty {
                    HStack {
                        Text("Path:")
                            .fontWeight(.medium)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                Button("Root") {
                                    currentPath = ""
                                    loadFiles()
                                }
                                .foregroundColor(.blue)
                                
                                ForEach(pathComponents, id: \.self) { component in
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.secondary)
                                        .font(.caption)
                                    
                                    Button(component) {
                                        navigateToPath(component)
                                    }
                                    .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            
            // File list
            if isLoading {
                VStack {
                    Spacer()
                    ProgressView("Loading files...")
                    Spacer()
                }
            } else if filteredFiles.isEmpty {
                VStack {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "folder")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)
                        
                        Text(searchText.isEmpty ? "No files found" : "No files match your search")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        if searchText.isEmpty {
                            Text("Upload files to get started")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                }
            } else {
                List(filteredFiles, id: \.id) { file in
                    FileRow(file: file) {
                        if file.isDirectory {
                            navigateToFile(file)
                        } else {
                            // Handle file selection
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showingUploadSheet) {
            FileStorageAddOrEdit(itemToEdit: nil)
        }
        .onAppear {
            loadProjects()
            loadFiles()
        }
    }
    
    private var pathComponents: [String] {
        currentPath.split(separator: "/").map(String.init)
    }
    
    private func loadProjects() {
        Task {
            // Load projects for the picker
            // This would need to be implemented based on your Supabase setup
        }
    }
    
    private func loadFiles() {
        isLoading = true
        
        Task {
            if let project = selectedProject {
                let projectFiles = await SBTableManager<FileStorage>.fetchFilesByProject(project.id.uW)
                await MainActor.run {
                    files = projectFiles
                    isLoading = false
                }
            } else {
                // Load all files or files from current path
                // This would need to be implemented based on your Supabase setup
                await MainActor.run {
                    files = []
                    isLoading = false
                }
            }
        }
    }
    
    private func navigateToPath(_ component: String) {
        // Navigate to specific path
        // This would need to be implemented based on your Supabase setup
    }
    
    private func navigateToFile(_ file: FileStorage) {
        // Navigate into directory
        // This would need to be implemented based on your Supabase setup
    }
}

struct FileRow: View {
    let file: FileStorage
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: file.fileTypeIcon)
                    .foregroundColor(.blue)
                    .frame(width: 20)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(file.name)
                        .fontWeight(.medium)
                    
                    Text(file.path)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(file.formattedSize)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(file.formattedDate)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

extension FileStorage {
    var isDirectory: Bool {
        // This would need to be implemented based on your file structure
        // For now, assuming files with no extension are directories
        return fileExtension.isEmpty
    }
}

#Preview {
    FileBrowser()
}
