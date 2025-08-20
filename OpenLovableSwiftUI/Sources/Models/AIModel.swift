import Foundation

/// Represents an AI model configuration
struct AIModel: Identifiable, Codable, Equatable, Hashable {
    let id: String
    let name: String
    let provider: AIProvider
    let capabilities: Set<AICapability>
    let maxTokens: Int
    let costPer1KTokens: Double
    let isAvailable: Bool
    
    init(id: String, name: String, provider: AIProvider, capabilities: Set<AICapability>, maxTokens: Int, costPer1KTokens: Double, isAvailable: Bool = true) {
        self.id = id
        self.name = name
        self.provider = provider
        self.capabilities = capabilities
        self.maxTokens = maxTokens
        self.costPer1KTokens = costPer1KTokens
        self.isAvailable = isAvailable
    }
}

/// AI service providers
enum AIProvider: String, Codable, CaseIterable {
    case openai = "openai"
    case anthropic = "anthropic"
    case google = "google"
    case groq = "groq"
    
    var displayName: String {
        switch self {
        case .openai: return "OpenAI"
        case .anthropic: return "Anthropic"
        case .google: return "Google"
        case .groq: return "Groq"
        }
    }
    
    var iconName: String {
        switch self {
        case .openai: return "brain.head.profile"
        case .anthropic: return "cpu"
        case .google: return "globe"
        case .groq: return "bolt"
        }
    }
}

/// AI model capabilities
enum AICapability: String, Codable, CaseIterable, Hashable {
    case codeGeneration = "code_generation"
    case webScraping = "web_scraping"
    case imageGeneration = "image_generation"
    case imageAnalysis = "image_analysis"
    case longContext = "long_context"
    case fastInference = "fast_inference"
    
    var displayName: String {
        switch self {
        case .codeGeneration: return "Code Generation"
        case .webScraping: return "Web Scraping"
        case .imageGeneration: return "Image Generation"
        case .imageAnalysis: return "Image Analysis"
        case .longContext: return "Long Context"
        case .fastInference: return "Fast Inference"
        }
    }
    
    var iconName: String {
        switch self {
        case .codeGeneration: return "curlybraces"
        case .webScraping: return "globe"
        case .imageGeneration: return "photo"
        case .imageAnalysis: return "eye"
        case .longContext: return "doc.text"
        case .fastInference: return "bolt"
        }
    }
}

/// Predefined AI models
extension AIModel {
    static let availableModels: [AIModel] = [
        AIModel(
            id: "gpt-4o",
            name: "GPT-4o",
            provider: .openai,
            capabilities: [.codeGeneration, .webScraping, .imageAnalysis, .longContext],
            maxTokens: 128000,
            costPer1KTokens: 0.005
        ),
        AIModel(
            id: "claude-3-5-sonnet-20241022",
            name: "Claude 3.5 Sonnet",
            provider: .anthropic,
            capabilities: [.codeGeneration, .webScraping, .longContext],
            maxTokens: 200000,
            costPer1KTokens: 0.003
        ),
        AIModel(
            id: "gemini-1.5-pro",
            name: "Gemini 1.5 Pro",
            provider: .google,
            capabilities: [.codeGeneration, .webScraping, .imageAnalysis, .longContext],
            maxTokens: 2000000,
            costPer1KTokens: 0.00125
        ),
        AIModel(
            id: "llama-3.1-70b-versatile",
            name: "Llama 3.1 70B",
            provider: .groq,
            capabilities: [.codeGeneration, .fastInference],
            maxTokens: 131072,
            costPer1KTokens: 0.00059
        )
    ]
    
    static let defaultModel = availableModels[1] // Claude 3.5 Sonnet
}