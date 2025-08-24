//
//  Secrets.swift
//  PengRF
//
//  Created by Stefan Crafoord-Wiklund on 2025-04-21.
//

import Foundation

// MARK: - Supabase Configuration
struct SupabaseConfig {
    static let url = "https://wpnucnsejqmqgtxdrwnt.supabase.co"
    static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODk2MDgsImV4cCI6MjA3MDQ2NTYwOH0.-22dSgPPUbCNnFY0QK48QNtzCK37kBd2odiahV6WmFU"
    // TODO: Replace with your actual service key from Supabase Dashboard > Settings > API > service_role key
    static let serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg4OTYwOCwiZXhwIjoyMDcwNDY1NjA4fQ.eVJn8uw5tne2VTAvHHw3OJ83AoVcC_p2vgypFK5BPZ4"
    static let bucketName = "project-files"
}

// MARK: - Other Secrets
struct Secrets {
    static let projectURLString = "https://wpnucnsejqmqgtxdrwnt.supabase.co"
    static let projectURL = URL(string: projectURLString)!
        
    static let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODk2MDgsImV4cCI6MjA3MDQ2NTYwOH0.-22dSgPPUbCNnFY0QK48QNtzCK37kBd2odiahV6WmFU"
    
    static let adminAPIKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbnVjbnNlanFtcWd0eGRyd250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg4OTYwOCwiZXhwIjoyMDcwNDY1NjA4fQ.eVJn8uw5tne2VTAvHHw3OJ83AoVcC_p2vgypFK5BPZ4"
}
