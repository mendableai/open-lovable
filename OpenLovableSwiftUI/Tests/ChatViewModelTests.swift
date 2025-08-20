import Testing
@testable import OpenLovableSwiftUI

/// Unit tests for ChatViewModel following Swift Testing best practices
@Suite("ChatViewModel Tests")
struct ChatViewModelTests {
    
    // MARK: - Test Initialization
    
    @Test("ChatViewModel initializes with welcome message")
    func testInitialization() {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        
        // When
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // Then
        #expect(viewModel.messages.count == 1)
        #expect(viewModel.messages.first?.type == .system)
        #expect(viewModel.messages.first?.content.contains("Welcome to Open Lovable!"))
        #expect(viewModel.isLoading == false)
        #expect(viewModel.error == nil)
        #expect(viewModel.sandboxData == nil)
    }
    
    @Test("ChatViewModel initializes with default AI model")
    func testDefaultAIModel() {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        
        // When
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // Then
        #expect(viewModel.selectedAIModel.id == AIModel.defaultModel.id)
        #expect(viewModel.selectedAIModel.name == "Claude 3.5 Sonnet")
    }
    
    // MARK: - Test Message Sending
    
    @Test("Send message creates user message and AI response")
    func testSendMessage() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // When
        await MainActor.run {
            viewModel.messageInput = "Create a SwiftUI button"
        }
        await viewModel.sendMessage()
        
        // Then
        await MainActor.run {
            #expect(viewModel.messages.count == 3) // Welcome + User + AI
            #expect(viewModel.messages[1].type == .user)
            #expect(viewModel.messages[1].content == "Create a SwiftUI button")
            #expect(viewModel.messages[2].type == .ai)
            #expect(viewModel.messageInput.isEmpty)
            #expect(viewModel.isLoading == false)
        }
    }
    
    @Test("Send empty message does nothing")
    func testSendEmptyMessage() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        let initialMessageCount = await MainActor.run { viewModel.messages.count }
        
        // When
        await MainActor.run {
            viewModel.messageInput = "   " // Whitespace only
        }
        await viewModel.sendMessage()
        
        // Then
        await MainActor.run {
            #expect(viewModel.messages.count == initialMessageCount)
        }
    }
    
    @Test("Send message handles network error")
    func testSendMessageNetworkError() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        mockNetworkManager.shouldThrowError = true
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // When
        await MainActor.run {
            viewModel.messageInput = "Test message"
        }
        await viewModel.sendMessage()
        
        // Then
        await MainActor.run {
            #expect(viewModel.error != nil)
            #expect(viewModel.messages.last?.type == .error)
            #expect(viewModel.isLoading == false)
        }
    }
    
    // MARK: - Test Sandbox Management
    
    @Test("Create sandbox successfully")
    func testCreateSandbox() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // When
        await viewModel.createSandbox()
        
        // Then
        await MainActor.run {
            #expect(viewModel.sandboxData != nil)
            #expect(viewModel.sandboxData?.status == .created)
            #expect(viewModel.messages.last?.type == .system)
            #expect(viewModel.messages.last?.content.contains("Sandbox created successfully"))
            #expect(viewModel.isLoading == false)
        }
    }
    
    @Test("Create sandbox handles error")
    func testCreateSandboxError() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        mockSandboxManager.shouldThrowError = true
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // When
        await viewModel.createSandbox()
        
        // Then
        await MainActor.run {
            #expect(viewModel.sandboxData == nil)
            #expect(viewModel.error != nil)
            #expect(viewModel.messages.last?.type == .error)
            #expect(viewModel.isLoading == false)
        }
    }
    
    @Test("Destroy sandbox successfully")
    func testDestroySandbox() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // First create a sandbox
        await viewModel.createSandbox()
        
        // When
        await viewModel.destroySandbox()
        
        // Then
        await MainActor.run {
            #expect(viewModel.sandboxData == nil)
            #expect(viewModel.sandboxFiles.isEmpty)
            #expect(viewModel.messages.last?.content.contains("destroyed successfully"))
        }
    }
    
    // MARK: - Test URL Scraping
    
    @Test("Scrape URL successfully")
    func testScrapeUrl() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // When
        await MainActor.run {
            viewModel.urlInput = "https://example.com"
        }
        await viewModel.scrapeUrl()
        
        // Then
        await MainActor.run {
            #expect(viewModel.messages.last?.type == .system)
            #expect(viewModel.messages.last?.content.contains("Scraped content"))
            #expect(viewModel.messages.last?.metadata?.scrapedUrl == "https://example.com")
            #expect(viewModel.urlInput.isEmpty)
            #expect(viewModel.isLoading == false)
        }
    }
    
    @Test("Scrape invalid URL does nothing")
    func testScrapeInvalidUrl() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        let initialMessageCount = await MainActor.run { viewModel.messages.count }
        
        // When
        await MainActor.run {
            viewModel.urlInput = "invalid-url"
        }
        await viewModel.scrapeUrl()
        
        // Then
        await MainActor.run {
            #expect(viewModel.messages.count == initialMessageCount)
        }
    }
    
    // MARK: - Test AI Model Selection
    
    @Test("Select AI model updates selected model")
    func testSelectAIModel() {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        let newModel = AIModel.availableModels.first { $0.provider == .openai }!
        
        // When
        viewModel.selectAIModel(newModel)
        
        // Then
        #expect(viewModel.selectedAIModel.id == newModel.id)
        #expect(viewModel.selectedAIModel.provider == .openai)
    }
    
    // MARK: - Test Clear Messages
    
    @Test("Clear messages resets to welcome message")
    func testClearMessages() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // Add some messages
        await MainActor.run {
            viewModel.messageInput = "Test message"
        }
        await viewModel.sendMessage()
        
        let messageCountBeforeClear = await MainActor.run { viewModel.messages.count }
        #expect(messageCountBeforeClear > 1)
        
        // When
        viewModel.clearMessages()
        
        // Then
        #expect(viewModel.messages.count == 1)
        #expect(viewModel.messages.first?.type == .system)
        #expect(viewModel.messages.first?.content.contains("Welcome to Open Lovable!"))
    }
    
    // MARK: - Test File Refresh
    
    @Test("Refresh sandbox files updates file list")
    func testRefreshSandboxFiles() async {
        // Given
        let mockNetworkManager = MockNetworkManager()
        let mockSandboxManager = MockSandboxManager()
        let viewModel = ChatViewModel(
            networkManager: mockNetworkManager,
            sandboxManager: mockSandboxManager
        )
        
        // Create sandbox first
        await viewModel.createSandbox()
        
        // When
        await viewModel.refreshSandboxFiles()
        
        // Then
        await MainActor.run {
            #expect(!viewModel.sandboxFiles.isEmpty)
            #expect(viewModel.sandboxFiles.count == 4) // Mock manager returns 4 files
            #expect(viewModel.sandboxFiles.contains { $0.fileName == "App.tsx" })
        }
    }
}

// MARK: - Model Tests

@Suite("Model Tests")
struct ModelTests {
    
    @Test("ChatMessage creates with correct properties")
    func testChatMessageCreation() {
        // Given
        let content = "Test message"
        let type = MessageType.user
        let metadata = MessageMetadata(generatedCode: "test code")
        
        // When
        let message = ChatMessage(content: content, type: type, metadata: metadata)
        
        // Then
        #expect(message.content == content)
        #expect(message.type == type)
        #expect(message.metadata?.generatedCode == "test code")
        #expect(message.timestamp <= Date())
    }
    
    @Test("SandboxData creates with correct properties")
    func testSandboxDataCreation() {
        // Given
        let sandboxId = "test-sandbox-123"
        let url = "https://test-sandbox.dev"
        
        // When
        let sandbox = SandboxData(sandboxId: sandboxId, url: url)
        
        // Then
        #expect(sandbox.sandboxId == sandboxId)
        #expect(sandbox.url == url)
        #expect(sandbox.status == .created)
        #expect(sandbox.createdAt <= Date())
    }
    
    @Test("FileType from extension works correctly")
    func testFileTypeFromExtension() {
        // Test cases
        let testCases: [(String, FileType)] = [
            ("js", .javascript),
            ("ts", .typescript),
            ("jsx", .react),
            ("tsx", .reactTypeScript),
            ("css", .css),
            ("html", .html),
            ("json", .json),
            ("md", .markdown),
            ("txt", .text),
            ("unknown", .other)
        ]
        
        // Test each case
        for (extension, expectedType) in testCases {
            let actualType = FileType.from(extension: extension)
            #expect(actualType == expectedType, "Extension '\(extension)' should map to \(expectedType)")
        }
    }
    
    @Test("AIModel capabilities work correctly")
    func testAIModelCapabilities() {
        // Given
        let model = AIModel.availableModels.first { $0.provider == .anthropic }!
        
        // Then
        #expect(model.capabilities.contains(.codeGeneration))
        #expect(model.capabilities.contains(.longContext))
        #expect(model.name == "Claude 3.5 Sonnet")
        #expect(model.provider == .anthropic)
    }
}