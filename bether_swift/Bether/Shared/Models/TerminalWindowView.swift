// TerminalWindowView.swift
// Internal macOS
//
// Created by AI Assistant on 2025-08-14.

import SwiftUI

struct TerminalWindowView: View {
    @State private var command: String = ""
    @State private var output: String = "Welcome to the Celiador Terminal!\n"
    @FocusState private var inputFocused: Bool

    private let shell = Process()
    private let inputPipe = Pipe()
    private let outputPipe = Pipe()

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ScrollView {
                Text(output)
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.init(white: 0.9))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding([.top, .leading, .trailing])
            }
            Divider()
            HStack {
                Text(">$ ")
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.green)
                TextField("Enter command", text: $command, onCommit: runCommand)
                    .font(.system(.body, design: .monospaced))
                    .textFieldStyle(.plain)
                    .foregroundColor(.white)
                    .focused($inputFocused)
                    .onAppear { inputFocused = true }
                Button("Run", action: runCommand)
                    .keyboardShortcut(.return, modifiers: [.command])
            }
            .padding(.all, 8)
            .background(Color(white: 0.2))
        }
        .background(Color.black)
        .frame(minWidth: 540, minHeight: 320)
        .onAppear(perform: setupShell)
        .onDisappear(perform: stopShell)
    }

    func setupShell() {
        shell.executableURL = URL(fileURLWithPath: "/bin/zsh")
        shell.standardInput = inputPipe
        shell.standardOutput = outputPipe
        shell.standardError = outputPipe

        do {
            try shell.run()
        } catch {
            output += "Failed to start shell: \(error)\n"
            return
        }

        outputPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            if let str = String(data: data, encoding: .utf8), !str.isEmpty {
                DispatchQueue.main.async {
                    output += str
                }
            }
        }
    }

    func stopShell() {
        outputPipe.fileHandleForReading.readabilityHandler = nil
        if shell.isRunning {
            shell.terminate()
        }
    }

    func runCommand() {
        let trimmed = command.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let entered = command
        DispatchQueue.main.async {
            output += "$ " + entered + "\n"
        }
        if let data = (entered + "\n").data(using: .utf8) {
            inputPipe.fileHandleForWriting.write(data)
        }
        command = ""
        inputFocused = true
    }
}

#if DEBUG
#Preview {
    TerminalWindowView()
}
#endif
