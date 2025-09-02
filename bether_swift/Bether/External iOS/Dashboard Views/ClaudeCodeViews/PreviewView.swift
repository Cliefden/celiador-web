//
//  PreviewView.swift
//  Bether
//
//  Created by Claude on 2025-08-31.
//

import SwiftUI
import WebKit
import Supabasable
import OptionalHelpers

// MARK: - Preview Models

struct PreviewInstance: Codable, Identifiable {
    let id: String
    let projectId: String
    let userId: String
    let url: String
    let port: Int
    let status: String
    let localPath: String?
    let syncResult: SyncResult?
    let startTime: String
    let lastAccessed: String?
    
    struct SyncResult: Codable {
        let success: Bool
        let filesDownloaded: Int
        let errors: [String]
        let localPath: String
    }
}

enum PreviewDevice: String, CaseIterable {
    case desktop = "desktop"
    case tablet = "tablet" 
    case mobile = "mobile"
    
    var displayName: String {
        switch self {
        case .desktop: return "Desktop"
        case .tablet: return "Tablet"
        case .mobile: return "Mobile"
        }
    }
    
    var iconName: String {
        switch self {
        case .desktop: return "display"
        case .tablet: return "ipad"
        case .mobile: return "iphone"
        }
    }
    
    var frameSize: CGSize {
        switch self {
        case .desktop: return CGSize(width: UIScreen.main.bounds.width - 40, height: UIScreen.main.bounds.height - 200)
        case .tablet: return CGSize(width: 768, height: 1024)
        case .mobile: return CGSize(width: 375, height: 667)
        }
    }
}

// MARK: - WebView Coordinator

class PreviewWebViewCoordinator: NSObject, WKNavigationDelegate {
    var parent: PreviewWebView
    
    init(_ parent: PreviewWebView) {
        self.parent = parent
    }
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        parent.isLoading = true
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        parent.isLoading = false
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        parent.isLoading = false
        parent.loadError = error.localizedDescription
    }
}

// MARK: - WebView Component

struct PreviewWebView: UIViewRepresentable {
    let url: String
    @Binding var isLoading: Bool
    @Binding var loadError: String?
    
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.bounces = false
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        if let url = URL(string: url) {
            let request = URLRequest(url: url)
            uiView.load(request)
        }
    }
    
    func makeCoordinator() -> PreviewWebViewCoordinator {
        PreviewWebViewCoordinator(self)
    }
}

// MARK: - Preview Service

@MainActor
@Observable
class PreviewService {
    var preview: PreviewInstance?
    var isLoading = false
    var error: String?
    
    private let baseURL = "http://192.168.68.56:3001" // Orchestrator URL
    
    func startPreview(for project: Project) async {
        guard let projectId = project.id, let userId = project.userId else { return }
        
        isLoading = true
        error = nil
        
        do {
            let response = try await makeRequest(
                endpoint: "/api/projects/\(projectId.uuidString)/preview/start",
                method: "POST",
                userId: userId.uuidString
            )
            
            if let data = response.data(using: .utf8) {
                preview = try JSONDecoder().decode(PreviewInstance.self, from: data)
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func stopPreview(for project: Project) async {
        guard let projectId = project.id, let userId = project.userId else { return }
        
        isLoading = true
        error = nil
        
        do {
            _ = try await makeRequest(
                endpoint: "/api/projects/\(projectId.uuidString)/preview/stop",
                method: "POST",
                userId: userId.uuidString
            )
            preview = nil
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refreshPreview(for project: Project) async {
        guard let projectId = project.id, let userId = project.userId else { return }
        guard preview != nil else { return }
        
        isLoading = true
        error = nil
        
        do {
            let response = try await makeRequest(
                endpoint: "/api/projects/\(projectId.uuidString)/preview/restart",
                method: "POST",
                userId: userId.uuidString
            )
            
            if let data = response.data(using: .utf8) {
                preview = try JSONDecoder().decode(PreviewInstance.self, from: data)
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func pollPreviewStatus(for project: Project) async {
        guard let projectId = project.id, let userId = project.userId else { return }
        
        do {
            let response = try await makeRequest(
                endpoint: "/api/projects/\(projectId.uuidString)/preview",
                method: "GET",
                userId: userId.uuidString
            )
            
            if let data = response.data(using: .utf8) {
                preview = try JSONDecoder().decode(PreviewInstance.self, from: data)
            }
        } catch {
            // Silent failure for polling
        }
    }
    
    private func makeRequest(endpoint: String, method: String, userId: String) async throws -> String {
        guard let url = URL(string: baseURL + endpoint) else {
            throw PreviewError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(userId, forHTTPHeaderField: "X-User-ID")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw PreviewError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw PreviewError.httpError(httpResponse.statusCode)
        }
        
        return String(data: data, encoding: .utf8) ?? ""
    }
}

enum PreviewError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid preview URL"
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code):
            return "Server error (\(code))"
        }
    }
}

// MARK: - Preview View

struct PreviewView: View {
    let project: Project?
    @Environment(SBAuthViewModel.self) var auth
    @State private var previewService = PreviewService()
    @State private var selectedDevice: PreviewDevice = .desktop
    @State private var isWebViewLoading = false
    @State private var webViewError: String?
    @State private var pollTimer: Timer?
    
    var body: some View {
        VStack(spacing: 0) {
            // Preview Controls
            previewControls
            
            // Preview Content
            previewContent
        }
        .onFirstAppear {
            startPolling()
        }
        .onDisappear {
            stopPolling()
        }
        .onChange(of: project?.id) { _, _ in
            // Reset preview when project changes
            previewService.preview = nil
            previewService.error = nil
        }
    }
    
    private var previewControls: some View {
        VStack(spacing: 12) {
            // Status and Controls Row
            HStack {
                // Status Indicator
                HStack(spacing: 8) {
                    if let preview = previewService.preview {
                        Circle()
                            .fill(statusColor(preview.status))
                            .frame(width: 8, height: 8)
                        
                        Text(statusLabel(preview.status))
                            .font(.caption)
                            .fontWeight(.medium)
                        
                        if let syncResult = preview.syncResult {
                            Text("\(syncResult.filesDownloaded) files")
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color(.systemGray5))
                                .cornerRadius(4)
                        }
                    } else {
                        Text("No Preview")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                // Action Buttons
                HStack(spacing: 8) {
                    if previewService.preview?.status == "running" {
                        Button {
                            refreshPreview()
                        } label: {
                            Image(systemName: "arrow.clockwise")
                                .font(.caption)
                        }
                        .buttonStyle(.bordered)
                        .disabled(previewService.isLoading)
                        
                        Button {
                            openInSafari()
                        } label: {
                            Image(systemName: "safari")
                                .font(.caption)
                        }
                        .buttonStyle(.bordered)
                        
                        Button {
                            stopPreview()
                        } label: {
                            Image(systemName: "stop.fill")
                                .font(.caption)
                        }
                        .buttonStyle(.bordered)
                        .disabled(previewService.isLoading)
                    } else {
                        Button {
                            startPreview()
                        } label: {
                            HStack(spacing: 4) {
                                if previewService.isLoading {
                                    ProgressView()
                                        .scaleEffect(0.7)
                                } else {
                                    Image(systemName: previewService.preview != nil ? "arrow.clockwise" : "play.fill")
                                        .font(.caption)
                                }
                                Text(previewService.isLoading ? "Starting..." : 
                                     previewService.preview != nil ? "Restart" : "Start Preview")
                                    .font(.caption)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(previewService.isLoading || project == nil)
                    }
                }
            }
            
            // Device Selection
            HStack {
                Text("Device")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                HStack(spacing: 8) {
                    ForEach(PreviewDevice.allCases, id: \.self) { device in
                        Button {
                            selectedDevice = device
                        } label: {
                            Image(systemName: device.iconName)
                                .font(.caption)
                                .foregroundColor(selectedDevice == device ? .white : .primary)
                        }
                        .buttonStyle(.bordered)
                        .background(selectedDevice == device ? Color.accentColor : Color.clear)
                        .cornerRadius(6)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
    }
    
    private var previewContent: some View {
        Group {
            if let error = previewService.error {
                // Error State
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 48))
                        .foregroundColor(.red)
                    
                    Text("Preview Error")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(error)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button("Try Again") {
                        if previewService.preview != nil {
                            refreshPreview()
                        } else {
                            startPreview()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                
            } else if previewService.preview == nil {
                // No Preview State
                VStack(spacing: 16) {
                    Image(systemName: "display")
                        .font(.system(size: 64))
                        .foregroundColor(.gray)
                    
                    Text("No Preview Running")
                        .font(.title2)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    
                    Text("Start a live preview to see your project in action. Files will be synced automatically.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    if project != nil {
                        Button("Start Preview") {
                            startPreview()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(previewService.isLoading)
                    } else {
                        Text("Select a project to start preview")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                
            } else if let preview = previewService.preview {
                if preview.status == "syncing" || preview.status == "starting" {
                    // Loading State
                    VStack(spacing: 16) {
                        ProgressView()
                            .scaleEffect(1.5)
                        
                        Text(preview.status == "syncing" ? "Syncing Files..." : "Starting Preview...")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(preview.status == "syncing" ? 
                             "Downloading project files from storage and installing dependencies" :
                             "Setting up development server")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        if let syncResult = preview.syncResult, preview.status == "starting" {
                            Text("\(syncResult.filesDownloaded) files synced")
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color(.systemGray5))
                                .cornerRadius(8)
                        }
                    }
                    .padding()
                    
                } else if preview.status == "running" {
                    // Preview WebView
                    let frameSize = selectedDevice.frameSize
                    let maxSize = CGSize(
                        width: UIScreen.main.bounds.width - 40,
                        height: UIScreen.main.bounds.height - 300
                    )
                    
                    let finalSize = CGSize(
                        width: min(frameSize.width, maxSize.width),
                        height: min(frameSize.height, maxSize.height)
                    )
                    
                    VStack {
                        if isWebViewLoading {
                            ProgressView("Loading...")
                                .frame(width: finalSize.width, height: finalSize.height)
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                        } else {
                            PreviewWebView(
                                url: preview.url,
                                isLoading: $isWebViewLoading,
                                loadError: $webViewError
                            )
                            .frame(width: finalSize.width, height: finalSize.height)
                            .background(Color.white)
                            .cornerRadius(12)
                            .shadow(radius: 4)
                        }
                        
                        if let error = webViewError {
                            Text("Error loading preview: \(error)")
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(.top, 8)
                        }
                    }
                    .padding()
                    
                } else {
                    // Stopped/Error State
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.circle")
                            .font(.system(size: 48))
                            .foregroundColor(.orange)
                        
                        Text("Preview Stopped")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("The preview server has stopped. Click restart to start it again.")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Button("Restart Preview") {
                            refreshPreview()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(previewService.isLoading)
                    }
                    .padding()
                }
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func startPreview() {
        guard let project = project else { return }
        
        Task {
            await previewService.startPreview(for: project)
        }
    }
    
    private func stopPreview() {
        guard let project = project else { return }
        
        Task {
            await previewService.stopPreview(for: project)
        }
    }
    
    private func refreshPreview() {
        guard let project = project else { return }
        
        Task {
            await previewService.refreshPreview(for: project)
        }
    }
    
    private func openInSafari() {
        guard let preview = previewService.preview,
              let url = URL(string: preview.url) else { return }
        
        UIApplication.shared.open(url)
    }
    
    private func startPolling() {
        guard let project = project else { return }
        
        pollTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { _ in
            Task {
                await previewService.pollPreviewStatus(for: project)
            }
        }
    }
    
    private func stopPolling() {
        pollTimer?.invalidate()
        pollTimer = nil
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case "running": return .green
        case "starting": return .yellow
        case "syncing": return .blue
        case "error": return .red
        case "stopped": return .gray
        default: return .gray
        }
    }
    
    private func statusLabel(_ status: String) -> String {
        switch status {
        case "running": return "Running"
        case "starting": return "Starting"
        case "syncing": return "Syncing Files"
        case "error": return "Error"
        case "stopped": return "Stopped"
        default: return "Unknown"
        }
    }
}
