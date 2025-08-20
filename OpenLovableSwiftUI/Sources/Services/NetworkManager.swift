import Foundation

/// Protocol for network operations
protocol NetworkManagerProtocol {
    func generateAIResponse(message: String, context: ConversationContext, model: AIModel) async throws -> AIResponse
    func scrapeUrl(_ url: URL) async throws -> ScrapedContent
}

/// Network manager for API communications
final class NetworkManager: NetworkManagerProtocol {
    
    // MARK: - Properties
    private let session = URLSession.shared
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    
    // MARK: - Configuration
    private struct APIConfig {
        static let baseURL = "https://api.openlovable.dev"
        static let timeout: TimeInterval = 30.0
    }
    
    // MARK: - Initialization
    init() {
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - NetworkManagerProtocol Implementation
    
    func generateAIResponse(message: String, context: ConversationContext, model: AIModel) async throws -> AIResponse {
        let request = AIGenerationRequest(
            message: message,
            model: model.id,
            context: context.messages.map { message in
                AIMessageContext(
                    content: message.content,
                    type: message.type.rawValue,
                    timestamp: message.timestamp
                )
            },
            sandboxFiles: context.sandboxFiles.map { file in
                AISandboxFileContext(
                    path: file.path,
                    content: file.content,
                    type: file.type.rawValue
                )
            }
        )
        
        let url = URL(string: "\(APIConfig.baseURL)/api/generate-ai-code-stream")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.timeout
        
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatError.networkError("Invalid response")
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw ChatError.networkError("HTTP \(httpResponse.statusCode)")
        }
        
        let aiResponse = try decoder.decode(AIGenerationResponse.self, from: data)
        
        return AIResponse(
            content: aiResponse.content,
            generatedCode: aiResponse.generatedCode
        )
    }
    
    func scrapeUrl(_ url: URL) async throws -> ScrapedContent {
        let request = URLScrapingRequest(url: url.absoluteString)
        
        let apiUrl = URL(string: "\(APIConfig.baseURL)/api/scrape-url-enhanced")!
        var urlRequest = URLRequest(url: apiUrl)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.timeout
        
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatError.networkError("Invalid response")
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw ChatError.networkError("HTTP \(httpResponse.statusCode)")
        }
        
        let scrapingResponse = try decoder.decode(URLScrapingResponse.self, from: data)
        
        return ScrapedContent(
            url: url.absoluteString,
            content: scrapingResponse.content,
            title: scrapingResponse.title
        )
    }
}

// MARK: - Request/Response Models

private struct AIGenerationRequest: Codable {
    let message: String
    let model: String
    let context: [AIMessageContext]
    let sandboxFiles: [AISandboxFileContext]
}

private struct AIMessageContext: Codable {
    let content: String
    let type: String
    let timestamp: Date
}

private struct AISandboxFileContext: Codable {
    let path: String
    let content: String
    let type: String
}

private struct AIGenerationResponse: Codable {
    let content: String
    let generatedCode: String?
    let appliedFiles: [String]?
}

private struct URLScrapingRequest: Codable {
    let url: String
}

private struct URLScrapingResponse: Codable {
    let content: String
    let title: String?
    let url: String
}

// MARK: - Mock Implementation for Testing

final class MockNetworkManager: NetworkManagerProtocol {
    var shouldThrowError = false
    var mockAIResponse: AIResponse?
    var mockScrapedContent: ScrapedContent?
    
    func generateAIResponse(message: String, context: ConversationContext, model: AIModel) async throws -> AIResponse {
        if shouldThrowError {
            throw ChatError.networkError("Mock error")
        }
        
        // Simulate network delay
        try await Task.sleep(nanoseconds: 1_000_000_000)
        
        return mockAIResponse ?? AIResponse(
            content: "This is a mock AI response for: \(message)",
            generatedCode: """
            import SwiftUI

            struct MockGeneratedView: View {
                var body: some View {
                    Text("Generated from: \\(message)")
                        .padding()
                }
            }
            """
        )
    }
    
    func scrapeUrl(_ url: URL) async throws -> ScrapedContent {
        if shouldThrowError {
            throw ChatError.networkError("Mock scraping error")
        }
        
        // Simulate network delay
        try await Task.sleep(nanoseconds: 500_000_000)
        
        return mockScrapedContent ?? ScrapedContent(
            url: url.absoluteString,
            content: "Mock scraped content from \(url.absoluteString)",
            title: "Mock Title"
        )
    }
}