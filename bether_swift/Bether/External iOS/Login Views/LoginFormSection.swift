//
//  LoginFormSection.swift
//  External iOS
//
//  Created by Stefan Crafoord-Wiklund on 2025-08-07.
//

import SwiftUI
import AuthenticationServices
import Supabasable

struct LoginFormSection: View {
    @Environment(SBAuthViewModel.self) var auth
    @Environment(\.dismiss) var dismiss
    @State private var isEmailValid = true
    @State private var isPasswordValid = true
    @State private var isPasswordVisible = false
    @State private var alertMessage = ""
    @State private var showAlert = false
    @State private var isLoading = false
    
    var body: some View {
        @Bindable var auth = auth
        VStack(spacing: 24) {
            VStack(spacing: 20) {
                // Email Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email Address")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    HStack {
                        Image(systemName: "envelope")
                            .foregroundColor(.secondary)
                            .frame(width: 20)
                        
                        TextField("your@email.com", text: $auth.userEmail)
                            .textFieldStyle(PlainTextFieldStyle())
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .onChange(of: auth.userEmail) { _, newValue in
                                validateEmail()
                            }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isEmailValid ? Color(.systemGray4) : Color.red, lineWidth: 1)
                    )
                    
                    if !isEmailValid {
                        Text("Please enter a valid email address")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                // Password Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    HStack {
                        Image(systemName: "lock")
                            .foregroundColor(.secondary)
                            .frame(width: 20)
                        
                        if isPasswordVisible {
                            TextField("Enter your password", text: $auth.userPassword)
                                .textFieldStyle(PlainTextFieldStyle())
                                .onChange(of: auth.userPassword) { _, newValue in
                                    validatePassword()
                                }
                        } else {
                            SecureField("Enter your password", text: $auth.userPassword)
                                .textFieldStyle(PlainTextFieldStyle())
                                .onChange(of: auth.userPassword) { _, newValue in
                                    validatePassword()
                                }
                        }
                        
                        Button(action: {
                            isPasswordVisible.toggle()
                        }) {
                            Image(systemName: isPasswordVisible ? "eye.slash" : "eye")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isPasswordValid ? Color(.systemGray4) : Color.red, lineWidth: 1)
                    )
                    
                    if !isPasswordValid {
                        Text("Password must be at least 6 characters")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                // Forgot Password
                HStack {
                    Spacer()
                    Button("Forgot Password?") {
                        // Handle forgot password
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
            }
            .padding(.horizontal, 20)
            
            // Sign In Button
            VStack(spacing: 16) {
                
                Button {
                    handleSignIn()
                    dismiss()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Text("Sign In")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .font(.headline)
                }
                .disabled(!isFormValid || isLoading)
                
                // Or Divider
                HStack {
                    Rectangle()
                        .frame(height: 1)
                        .foregroundColor(Color(.systemGray4))
                    
                    Text("or")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 16)
                    
                    Rectangle()
                        .frame(height: 1)
                        .foregroundColor(Color(.systemGray4))
                }
                .padding(.horizontal, 20)
                
                // Sign Up Link
                HStack {
                    Text("Don't have an account?")
                        .font(.body)
                        .foregroundColor(.secondary)
                    
                    Button("Sign Up") {
                        // Handle sign up navigation
                    }
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
                }
            }
            .padding(.horizontal, 20)
        }
        .alert("Login", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
    }
    private func validateEmail() {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        isEmailValid = auth.userEmail.isEmpty || emailPredicate.evaluate(with: auth.userEmail)
    }
    
    private func validatePassword() {
        isPasswordValid = auth.userPassword.count >= 6
    }
    
    private var isFormValid: Bool {
        !auth.userEmail.isEmpty && isEmailValid && isPasswordValid
    }
    
    private func handleSignIn() {
        guard isFormValid else {
            alertMessage = "Please fill in all required fields correctly"
            showAlert = true
            return
        }
        auth.handleSignin()
    }
}

#Preview {
    LoginFormSection()
}
