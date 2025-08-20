import Foundation

/// Represents a chat message in the conversation
struct ChatMessage: Identifiable, Codable, Equatable {
    let id = UUID()
    let content: String
    let type: MessageType
    let timestamp: Date
    let metadata: MessageMetadata?
    
    init(content: String, type: MessageType, metadata: MessageMetadata? = nil) {
        self.content = content
        self.type = type
        self.timestamp = Date()
        self.metadata = metadata
    }
}

/// Types of messages in the chat
enum MessageType: String, Codable, CaseIterable {
    case user = "user"
    case ai = "ai"
    case system = "system"
    case fileUpdate = "file-update"
    case command = "command"
    case error = "error"
    
    var displayName: String {
        switch self {
        case .user: return "You"
        case .ai: return "AI Assistant"
        case .system: return "System"
        case .fileUpdate: return "File Update"
        case .command: return "Command"
        case .error: return "Error"
        }
    }
    
    var iconName: String {
        switch self {
        case .user: return "person.fill"
        case .ai: return "brain.head.profile"
        case .system: return "gear"
        case .fileUpdate: return "doc.text"
        case .command: return "terminal"
        case .error: return "exclamationmark.triangle.fill"
        }
    }
}

/// Additional metadata for messages
struct MessageMetadata: Codable, Equatable {
    let scrapedUrl: String?
    let scrapedContent: String?
    let generatedCode: String?
    let appliedFiles: [String]?
    let commandType: CommandType?
    
    init(scrapedUrl: String? = nil,
         scrapedContent: String? = nil,
         generatedCode: String? = nil,
         appliedFiles: [String]? = nil,
         commandType: CommandType? = nil) {
        self.scrapedUrl = scrapedUrl
        self.scrapedContent = scrapedContent
        self.generatedCode = generatedCode
        self.appliedFiles = appliedFiles
        self.commandType = commandType
    }
}

/// Types of commands
enum CommandType: String, Codable, CaseIterable {
    case input = "input"
    case output = "output"
    case error = "error"
    case success = "success"
}