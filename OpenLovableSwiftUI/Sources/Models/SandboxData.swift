import Foundation

/// Represents sandbox data for code execution
struct SandboxData: Identifiable, Codable, Equatable {
    let id = UUID()
    let sandboxId: String
    let url: String
    let status: SandboxStatus
    let createdAt: Date
    let lastUpdated: Date
    
    init(sandboxId: String, url: String, status: SandboxStatus = .created) {
        self.sandboxId = sandboxId
        self.url = url
        self.status = status
        self.createdAt = Date()
        self.lastUpdated = Date()
    }
}

/// Status of the sandbox
enum SandboxStatus: String, Codable, CaseIterable {
    case creating = "creating"
    case created = "created"
    case running = "running"
    case stopped = "stopped"
    case error = "error"
    case destroyed = "destroyed"
    
    var displayName: String {
        switch self {
        case .creating: return "Creating..."
        case .created: return "Created"
        case .running: return "Running"
        case .stopped: return "Stopped"
        case .error: return "Error"
        case .destroyed: return "Destroyed"
        }
    }
    
    var color: String {
        switch self {
        case .creating: return "orange"
        case .created: return "blue"
        case .running: return "green"
        case .stopped: return "yellow"
        case .error: return "red"
        case .destroyed: return "gray"
        }
    }
    
    var isActive: Bool {
        switch self {
        case .running, .created: return true
        default: return false
        }
    }
}

/// File structure in the sandbox
struct SandboxFile: Identifiable, Codable, Equatable {
    let id = UUID()
    let path: String
    let content: String
    let type: FileType
    let lastModified: Date
    
    init(path: String, content: String, type: FileType) {
        self.path = path
        self.content = content
        self.type = type
        self.lastModified = Date()
    }
    
    var fileName: String {
        String(path.split(separator: "/").last ?? "")
    }
    
    var directory: String {
        let components = path.split(separator: "/")
        return components.dropLast().joined(separator: "/")
    }
}

/// Types of files in the sandbox
enum FileType: String, Codable, CaseIterable {
    case javascript = "js"
    case typescript = "ts"
    case react = "jsx"
    case reactTypeScript = "tsx"
    case css = "css"
    case html = "html"
    case json = "json"
    case markdown = "md"
    case text = "txt"
    case other = "other"
    
    var iconName: String {
        switch self {
        case .javascript, .typescript: return "curlybraces"
        case .react, .reactTypeScript: return "atom"
        case .css: return "paintbrush"
        case .html: return "globe"
        case .json: return "doc.text"
        case .markdown: return "doc.richtext"
        case .text: return "doc.plaintext"
        case .other: return "doc"
        }
    }
    
    var color: String {
        switch self {
        case .javascript: return "yellow"
        case .typescript: return "blue"
        case .react, .reactTypeScript: return "cyan"
        case .css: return "purple"
        case .html: return "orange"
        case .json: return "green"
        case .markdown: return "gray"
        case .text: return "gray"
        case .other: return "gray"
        }
    }
    
    static func from(extension: String) -> FileType {
        switch `extension`.lowercased() {
        case "js": return .javascript
        case "ts": return .typescript
        case "jsx": return .react
        case "tsx": return .reactTypeScript
        case "css": return .css
        case "html": return .html
        case "json": return .json
        case "md": return .markdown
        case "txt": return .text
        default: return .other
        }
    }
}