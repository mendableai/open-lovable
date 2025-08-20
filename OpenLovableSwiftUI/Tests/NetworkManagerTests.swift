import Testing
@testable import OpenLovableSwiftUI

/// Unit tests for NetworkManager and related services
@Suite("NetworkManager Tests")
struct NetworkManagerTests {
    
    // MARK: - Test Mock Network Manager
    
    @Test("MockNetworkManager generates AI response successfully")
    func testMockNetworkManagerAIResponse() async throws {
        // Given
        let mockManager = MockNetworkManager()
        let context = ConversationContext(
            messages: [],
            sandboxFiles: [],
            selectedModel: AIModel.defaultModel
        )
        
        // When
        let response = try await mockManager.generateAIResponse(
            message: "Create a SwiftUI button",
            context: context,
            model: AIModel.defaultModel
        )
        
        // Then
        #expect(!response.content.isEmpty)
        #expect(response.content.contains("Create a SwiftUI button"))
        #expect(response.generatedCode != nil)
        #expect(response.generatedCode!.contains("import SwiftUI"))
    }
    
    @Test("MockNetworkManager handles errors correctly")
    func testMockNetworkManagerError() async {
        // Given
        let mockManager = MockNetworkManager()
        mockManager.shouldThrowError = true
        let context = ConversationContext(
            messages: [],
            sandboxFiles: [],
            selectedModel: AIModel.defaultModel
        )
        
        // When/Then
        await #expect(throws: ChatError.self) {
            try await mockManager.generateAIResponse(
                message: "Test message",
                context: context,
                model: AIModel.defaultModel
            )
        }
    }
    
    @Test("MockNetworkManager scrapes URL successfully")
    func testMockNetworkManagerScrapeUrl() async throws {
        // Given
        let mockManager = MockNetworkManager()
        let testUrl = URL(string: "https://example.com")!
        
        // When
        let scrapedContent = try await mockManager.scrapeUrl(testUrl)
        
        // Then
        #expect(scrapedContent.url == testUrl.absoluteString)
        #expect(!scrapedContent.content.isEmpty)
        #expect(scrapedContent.content.contains("example.com"))
        #expect(scrapedContent.title == "Mock Title")
    }
    
    @Test("MockNetworkManager custom response works")
    func testMockNetworkManagerCustomResponse() async throws {
        // Given
        let mockManager = MockNetworkManager()
        let customResponse = AIResponse(
            content: "Custom AI response",
            generatedCode: "struct CustomView: View { }"
        )
        mockManager.mockAIResponse = customResponse
        
        let context = ConversationContext(
            messages: [],
            sandboxFiles: [],
            selectedModel: AIModel.defaultModel
        )
        
        // When
        let response = try await mockManager.generateAIResponse(
            message: "Test",
            context: context,
            model: AIModel.defaultModel
        )
        
        // Then
        #expect(response.content == "Custom AI response")
        #expect(response.generatedCode == "struct CustomView: View { }")
    }
}

// MARK: - SandboxManager Tests

@Suite("SandboxManager Tests")
struct SandboxManagerTests {
    
    @Test("MockSandboxManager creates sandbox successfully")
    func testMockSandboxManagerCreateSandbox() async throws {
        // Given
        let mockManager = MockSandboxManager()
        
        // When
        let sandbox = try await mockManager.createSandbox()
        
        // Then
        #expect(!sandbox.sandboxId.isEmpty)
        #expect(sandbox.sandboxId.contains("mock-sandbox"))
        #expect(sandbox.url == "https://mock-sandbox.dev")
        #expect(sandbox.status == .created)
    }
    
    @Test("MockSandboxManager handles creation error")
    func testMockSandboxManagerCreateSandboxError() async {
        // Given
        let mockManager = MockSandboxManager()
        mockManager.shouldThrowError = true
        
        // When/Then
        await #expect(throws: ChatError.self) {
            try await mockManager.createSandbox()
        }
    }
    
    @Test("MockSandboxManager gets sandbox files")
    func testMockSandboxManagerGetFiles() async throws {
        // Given
        let mockManager = MockSandboxManager()
        
        // Create sandbox first to populate mock files
        _ = try await mockManager.createSandbox()
        
        // When
        let files = try await mockManager.getSandboxFiles(sandboxId: "test-sandbox")
        
        // Then
        #expect(!files.isEmpty)
        #expect(files.count == 4)
        #expect(files.contains { $0.fileName == "App.tsx" })
        #expect(files.contains { $0.fileName == "Button.tsx" })
        #expect(files.contains { $0.fileName == "main.css" })
        #expect(files.contains { $0.fileName == "package.json" })
    }
    
    @Test("MockSandboxManager applies code successfully")
    func testMockSandboxManagerApplyCode() async throws {
        // Given
        let mockManager = MockSandboxManager()
        let testCode = "import React from 'react';\n\nfunction TestComponent() { return <div>Test</div>; }"
        
        // Create sandbox first
        _ = try await mockManager.createSandbox()
        let initialFileCount = try await mockManager.getSandboxFiles(sandboxId: "test").count
        
        // When
        try await mockManager.applyCode(sandboxId: "test-sandbox", code: testCode)
        
        // Then
        let updatedFiles = try await mockManager.getSandboxFiles(sandboxId: "test")
        #expect(updatedFiles.count == initialFileCount + 1)
        #expect(updatedFiles.last?.content == testCode)
        #expect(updatedFiles.last?.fileName == "GeneratedComponent.tsx")
    }
    
    @Test("MockSandboxManager runs commands")
    func testMockSandboxManagerRunCommand() async throws {
        // Given
        let mockManager = MockSandboxManager()
        let testCommand = "npm install"
        
        // When
        let output = try await mockManager.runCommand(sandboxId: "test-sandbox", command: testCommand)
        
        // Then
        #expect(!output.isEmpty)
        #expect(output.contains("Mock command output"))
        #expect(output.contains(testCommand))
    }
    
    @Test("MockSandboxManager destroys sandbox")
    func testMockSandboxManagerDestroySandbox() async throws {
        // Given
        let mockManager = MockSandboxManager()
        
        // Create sandbox first
        _ = try await mockManager.createSandbox()
        let filesBeforeDestroy = try await mockManager.getSandboxFiles(sandboxId: "test")
        #expect(!filesBeforeDestroy.isEmpty)
        
        // When
        try await mockManager.destroySandbox(sandboxId: "test-sandbox")
        
        // Then
        let filesAfterDestroy = try await mockManager.getSandboxFiles(sandboxId: "test")
        #expect(filesAfterDestroy.isEmpty)
    }
}

// MARK: - Error Handling Tests

@Suite("Error Handling Tests")
struct ErrorHandlingTests {
    
    @Test("ChatError provides correct descriptions")
    func testChatErrorDescriptions() {
        // Test different error types
        let networkError = ChatError.networkError("Connection failed")
        let sandboxError = ChatError.sandboxError("Sandbox creation failed")
        let invalidInputError = ChatError.invalidInput
        let unknownError = ChatError.unknown("Something went wrong")
        
        #expect(networkError.localizedDescription == "Network error: Connection failed")
        #expect(sandboxError.localizedDescription == "Sandbox error: Sandbox creation failed")
        #expect(invalidInputError.localizedDescription == "Invalid input provided")
        #expect(unknownError.localizedDescription == "Unknown error: Something went wrong")
    }
    
    @Test("Network timeout simulation")
    func testNetworkTimeout() async {
        // Given
        let mockManager = MockNetworkManager()
        let context = ConversationContext(
            messages: [],
            sandboxFiles: [],
            selectedModel: AIModel.defaultModel
        )
        
        // When - This should complete within reasonable time due to mock implementation
        let startTime = Date()
        let response = try! await mockManager.generateAIResponse(
            message: "Test message",
            context: context,
            model: AIModel.defaultModel
        )
        let duration = Date().timeIntervalSince(startTime)
        
        // Then
        #expect(duration >= 1.0) // Mock has 1 second delay
        #expect(duration < 2.0) // But should not take too long
        #expect(!response.content.isEmpty)
    }
}

// MARK: - Integration Tests

@Suite("Integration Tests")
struct IntegrationTests {
    
    @Test("Full workflow: Create sandbox, send message, apply code")
    func testFullWorkflow() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // When - Create sandbox
        await viewModel.createSandbox()
        
        // Then - Sandbox should be created
        await MainActor.run {
            #expect(viewModel.sandboxData != nil)
        }
        
        // When - Send message
        await MainActor.run {
            viewModel.messageInput = "Create a SwiftUI button component"
        }
        await viewModel.sendMessage()
        
        // Then - Message should be processed and code generated
        await MainActor.run {
            #expect(viewModel.messages.count >= 3) // Welcome + User + AI
            #expect(viewModel.messages.last?.type == .ai)
            #expect(viewModel.messages.last?.metadata?.generatedCode != nil)
        }
        
        // When - Refresh files
        await viewModel.refreshSandboxFiles()
        
        // Then - Files should be available
        await MainActor.run {
            #expect(!viewModel.sandboxFiles.isEmpty)
        }
    }
    
    @Test("Error recovery workflow")
    func testErrorRecoveryWorkflow() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        mockNetworkManager.shouldThrowError = true
        
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // When - Try to send message (should fail)
        await MainActor.run {
            viewModel.messageInput = "Test message"
        }
        await viewModel.sendMessage()
        
        // Then - Error should be handled
        await MainActor.run {
            #expect(viewModel.error != nil)
            #expect(viewModel.messages.last?.type == .error)
            #expect(viewModel.isLoading == false)
        }
        
        // When - Fix the error and try again
        mockNetworkManager.shouldThrowError = false
        await MainActor.run {
            viewModel.messageInput = "Test message retry"
        }
        await viewModel.sendMessage()
        
        // Then - Should work now
        await MainActor.run {
            #expect(viewModel.error == nil)
            #expect(viewModel.messages.last?.type == .ai)
            #expect(viewModel.isLoading == false)
        }
    }
}