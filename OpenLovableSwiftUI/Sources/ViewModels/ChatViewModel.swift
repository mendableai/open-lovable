import Foundation
import Observation

/// Main view model for chat functionality following SwiftUI best practices
@Observable
final class ChatViewModel {
    // MARK: - Published Properties
    private(set) var messages: [ChatMessage] = []
    private(set) var isLoading = false
    private(set) var error: ChatError?
    private(set) var sandboxData: SandboxData?
    private(set) var sandboxFiles: [SandboxFile] = []
    private(set) var selectedAIModel: AIModel = AIModel.defaultModel
    
    // MARK: - Input Properties
    var messageInput = ""
    var urlInput = ""
    
    // MARK: - Private Properties
    private let networkManager: NetworkManagerProtocol
    private let sandboxManager: SandboxManagerProtocol
    
    // MARK: - Initialization
    init(networkManager: NetworkManagerProtocol = NetworkManager(),
         sandboxManager: SandboxManagerProtocol = SandboxManager()) {
        self.networkManager = networkManager
        self.sandboxManager = sandboxManager
        setupInitialMessage()
    }
    
    // MARK: - Public Methods
    
    /// Sends a message to the AI
    @MainActor
    func sendMessage() async {
        guard !messageInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        let userMessage = ChatMessage(content: messageInput, type: .user)
        messages.append(userMessage)
        
        let currentInput = messageInput
        messageInput = ""
        isLoading = true
        error = nil
        
        do {
            // Create sandbox if needed
            if sandboxData == nil {
                await createSandbox()
            }
            
            // Generate AI response
            let aiResponse = try await networkManager.generateAIResponse(
                message: currentInput,
                context: buildConversationContext(),
                model: selectedAIModel
            )
            
            let aiMessage = ChatMessage(
                content: aiResponse.content,
                type: .ai,
                metadata: MessageMetadata(generatedCode: aiResponse.generatedCode)
            )
            messages.append(aiMessage)
            
            // Apply code if generated
            if let code = aiResponse.generatedCode {
                await applyGeneratedCode(code)
            }
            
        } catch {
            await handleError(error)
        }
        
        isLoading = false
    }
    
    /// Scrapes a URL and adds context to the conversation
    @MainActor
    func scrapeUrl() async {
        guard !urlInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let url = URL(string: urlInput) else { return }
        
        isLoading = true
        error = nil
        
        do {
            let scrapedContent = try await networkManager.scrapeUrl(url)
            
            let message = ChatMessage(
                content: "Scraped content from \(url.absoluteString)",
                type: .system,
                metadata: MessageMetadata(
                    scrapedUrl: url.absoluteString,
                    scrapedContent: scrapedContent.content
                )
            )
            messages.append(message)
            
            urlInput = ""
        } catch {
            await handleError(error)
        }
        
        isLoading = false
    }
    
    /// Creates a new sandbox
    @MainActor
    func createSandbox() async {
        isLoading = true
        error = nil
        
        do {
            sandboxData = try await sandboxManager.createSandbox()
            
            let message = ChatMessage(
                content: "Sandbox created successfully! ID: \(sandboxData?.sandboxId ?? "unknown")",
                type: .system
            )
            messages.append(message)
            
        } catch {
            await handleError(error)
        }
        
        isLoading = false
    }
    
    /// Refreshes sandbox files
    @MainActor
    func refreshSandboxFiles() async {
        guard let sandbox = sandboxData else { return }
        
        do {
            sandboxFiles = try await sandboxManager.getSandboxFiles(sandboxId: sandbox.sandboxId)
        } catch {
            await handleError(error)
        }
    }
    
    /// Changes the selected AI model
    func selectAIModel(_ model: AIModel) {
        selectedAIModel = model
    }
    
    /// Clears all messages
    func clearMessages() {
        messages.removeAll()
        setupInitialMessage()
    }
    
    /// Destroys the current sandbox
    @MainActor
    func destroySandbox() async {
        guard let sandbox = sandboxData else { return }
        
        do {
            try await sandboxManager.destroySandbox(sandboxId: sandbox.sandboxId)
            sandboxData = nil
            sandboxFiles.removeAll()
            
            let message = ChatMessage(
                content: "Sandbox destroyed successfully.",
                type: .system
            )
            messages.append(message)
            
        } catch {
            await handleError(error)
        }
    }
    
    // MARK: - Private Methods
    
    private func setupInitialMessage() {
        let welcomeMessage = ChatMessage(
            content: """
            Welcome to Open Lovable! 🎉
            
            I can help you generate SwiftUI code with full context awareness. Here's what I can do:
            
            • Generate SwiftUI views and components
            • Create Observable view models
            • Implement proper state management
            • Add accessibility features
            • Optimize performance
            
            Just start chatting - I'll automatically create a sandbox for you if needed!
            
            Tip: You can also scrape websites for design inspiration or reference.
            """,
            type: .system
        )
        messages.append(welcomeMessage)
    }
    
    private func buildConversationContext() -> ConversationContext {
        ConversationContext(
            messages: messages,
            sandboxFiles: sandboxFiles,
            selectedModel: selectedAIModel
        )
    }
    
    @MainActor
    private func applyGeneratedCode(_ code: String) async {
        // Apply the generated code to sandbox files
        // This would integrate with the sandbox manager
        do {
            guard let sandbox = sandboxData else { return }
            
            try await sandboxManager.applyCode(
                sandboxId: sandbox.sandboxId,
                code: code
            )
            
            await refreshSandboxFiles()
            
            let message = ChatMessage(
                content: "Code applied successfully to sandbox.",
                type: .system,
                metadata: MessageMetadata(generatedCode: code)
            )
            messages.append(message)
            
        } catch {
            await handleError(error)
        }
    }
    
    @MainActor
    private func handleError(_ error: Error) async {
        let chatError = error as? ChatError ?? .unknown(error.localizedDescription)
        self.error = chatError
        
        let errorMessage = ChatMessage(
            content: "Error: \(chatError.localizedDescription)",
            type: .error
        )
        messages.append(errorMessage)
    }
}

// MARK: - Supporting Types

struct ConversationContext {
    let messages: [ChatMessage]
    let sandboxFiles: [SandboxFile]
    let selectedModel: AIModel
}

struct AIResponse {
    let content: String
    let generatedCode: String?
}

struct ScrapedContent {
    let url: String
    let content: String
    let title: String?
}

enum ChatError: LocalizedError {
    case networkError(String)
    case sandboxError(String)
    case invalidInput
    case unknown(String)
    
    var errorDescription: String? {
        switch self {
        case .networkError(let message):
            return "Network error: \(message)"
        case .sandboxError(let message):
            return "Sandbox error: \(message)"
        case .invalidInput:
            return "Invalid input provided"
        case .unknown(let message):
            return "Unknown error: \(message)"
        }
    }
}