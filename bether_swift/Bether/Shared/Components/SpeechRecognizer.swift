//
//  SpeechRecognizer.swift
//  Celiador
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-30.
//

import Foundation
import Speech
import AVFAudio

@MainActor
@Observable
class SpeechRecognizer {
    var transcript = ""
    var isRecording = false
    var isAvailable = false
    var errorMessage: String?
    
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    init() {
        // Only initialize if speech recognition is supported
        guard SFSpeechRecognizer.supportedLocales().contains(Locale(identifier: "en-US")) else {
            isAvailable = false
            errorMessage = "Speech recognition not supported"
            return
        }
        
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
        
        Task {
            do {
                let hasPermission = await requestPermissions()
                isAvailable = hasPermission && (speechRecognizer?.isAvailable ?? false)
            } catch {
                errorMessage = "Permission request failed: \(error.localizedDescription)"
                isAvailable = false
            }
        }
    }
    
    func requestPermissions() async -> Bool {
        // Check speech recognition permission
        let speechStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
        
        guard speechStatus == .authorized else {
            errorMessage = "Speech recognition permission denied"
            return false
        }
        
        // Check microphone permission
        let audioStatus = await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        
        guard audioStatus else {
            errorMessage = "Microphone permission denied"
            return false
        }
        
        return true
    }
    
    func startRecording() {
        guard !isRecording else { return }
        
        do {
            // Stop any existing recording first
            if audioEngine.isRunning {
                audioEngine.stop()
                audioEngine.inputNode.removeTap(onBus: 0)
            }
            
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            
            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            guard let recognitionRequest = recognitionRequest else {
                errorMessage = "Unable to create recognition request"
                return
            }
            
            recognitionRequest.shouldReportPartialResults = true
            
            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
                recognitionRequest.append(buffer)
            }
            
            try audioEngine.start()
            
            isRecording = true
            transcript = ""
            errorMessage = nil
            
            recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                guard let self = self else { return }
                
                Task { @MainActor in
                    if let result = result {
                        self.transcript = result.bestTranscription.formattedString
                    }
                    
                    if error != nil || result?.isFinal == true {
                        self.stopRecording()
                    }
                }
            }
        } catch {
            errorMessage = "Recording failed: \(error.localizedDescription)"
            stopRecording()
        }
    }
    
    func stopRecording() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        
        isRecording = false
        
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            print("Failed to deactivate audio session: \(error)")
        }
    }
    
    func reset() {
        transcript = ""
        errorMessage = nil
    }
}

