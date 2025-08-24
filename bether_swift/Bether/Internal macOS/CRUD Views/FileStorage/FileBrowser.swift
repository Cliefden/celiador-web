import SwiftUI

struct FileBrowser: View {
    @StateObject private var fileManager = FileStorageManager.shared
    @State private var searchText = ""
    @State private var selectedProject: Project?
    @State private var projects: [Project] = []
    @State private var showingUploadSheet = false
    @State private var showingFileDetail = false
    @State private var selectedFile: FileStorage?
    @State private var showingEditSheet = false
    @State private var fileToEdit: FileStorage?
    
    var filteredFiles: [FileStorage] {
        if searchText.isEmpty {
            return fileManager.files
        } else {
            return fileManager.files.filter { file in
                file.name.localizedCaseInsensitiveContains(searchText) ||
                file.path.localizedCaseInsensitiveContains(searchText)
            }
        }
    }
    
    var pathComponents: [String] {
        let components = fileManager.currentPath.split(separator: "/").map(String.init)
        return components.filter { !$0.isEmpty }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 12) {
                HStack {
                    Text("Project Files")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Spacer()
                    
                    Button(action: loadFiles) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(fileManager.isLoading)
                }
                
                // Project selector
                HStack {
                    Text("Project:")
                        .fontWeight(.medium)
                    
                    Picker("Project", selection: $selectedProject) {
                        Text("All Projects").tag(nil as Project?)
                        ForEach(projects, id: \.id) { project in
                            Text(project.name ?? "Unnamed Project").tag(project as Project?)
                        }
                    }
                    .onChange(of: selectedProject) { _ in
                        loadFiles()
                    }
                    
                    Spacer()
                    
                    Button(action: loadFiles) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(fileManager.isLoading)
                }
                
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    
                    TextField("Search files...", text: $searchText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                // Breadcrumb
                if !fileManager.currentPath.isEmpty {
                    HStack {
                        Text("Path:")
                            .fontWeight(.medium)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                Button("Root") {
                                    fileManager.navigateToDirectory("")
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
            if fileManager.isLoading {
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
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredFiles, id: \.id) { file in
                            FileStorageCard(
                                file: file,
                                onEdit: {
                                    fileToEdit = file
                                    showingEditSheet = true
                                },
                                onDelete: {
                                    loadFiles()
                                }
                            )
                            .onTapGesture {
                                handleFileSelection(file)
                            }
                        }
                    }
                    .padding()
                }
            }
        }
        .sheet(isPresented: $showingUploadSheet) {
            FileStorageAddOrEdit(itemToEdit: nil)
        }
        .sheet(isPresented: $showingEditSheet) {
            if let fileToEdit = fileToEdit {
                FileStorageAddOrEdit(itemToEdit: fileToEdit)
            }
        }
        .overlay {
            if showingFileDetail, let selectedFile = selectedFile {
                VStack {
                    HStack {
                        Text(selectedFile.name)
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Spacer()
                        
                        Button("Done") {
                            self.selectedFile = nil
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    
                    FileStorageDetail(file: selectedFile)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .frame(width: 600, height: 500)
                .background(Color.white)
                .cornerRadius(12)
                .shadow(radius: 10)
            }
        }
        .onAppear {
            loadProjects()
            loadFiles()
        }
    }
    
    private func loadFiles() {
        Task {
            await fileManager.loadFiles()
        }
    }
    
    private func handleFileSelection(_ file: FileStorage) {
        if file.isDirectory {
            fileManager.navigateToDirectory(file.path)
            loadFiles()
        } else {
            selectedFile = file
            showingFileDetail = true
        }
    }
    
    private func navigateToPath(_ component: String) {
        // Navigate to the specific path component
        let currentComponents = pathComponents
        if let index = currentComponents.firstIndex(of: component) {
            let newPath = currentComponents.prefix(index + 1).joined(separator: "/")
            fileManager.navigateToDirectory(newPath)
            loadFiles()
        }
    }
    
    private func loadProjects() {
        Task {
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
                        let fetchedProjects = try JSONDecoder().decode([Project].self, from: data)
                        await MainActor.run {
                            self.projects = fetchedProjects
                            print("Loaded \(fetchedProjects.count) projects")
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
    }
}

#Preview {
    FileBrowser()
}
