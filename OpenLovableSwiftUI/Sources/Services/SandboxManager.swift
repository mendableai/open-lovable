import Foundation

/// Protocol for sandbox management operations
protocol SandboxManagerProtocol {
    func createSandbox() async throws -> SandboxData
    func destroySandbox(sandboxId: String) async throws
    func getSandboxFiles(sandboxId: String) async throws -> [SandboxFile]
    func applyCode(sandboxId: String, code: String) async throws
    func runCommand(sandboxId: String, command: String) async throws -> String
}

/// Manager for sandbox operations
final class SandboxManager: SandboxManagerProtocol {
    
    // MARK: - Properties
    private let session = URLSession.shared
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    
    // MARK: - Configuration
    private struct APIConfig {
        static let baseURL = "https://api.openlovable.dev"
        static let timeout: TimeInterval = 60.0
    }
    
    // MARK: - Initialization
    init() {
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - SandboxManagerProtocol Implementation
    
    func createSandbox() async throws -> SandboxData {
        let request = CreateSandboxRequest()
        
        let url = URL(string: "\(APIConfig.baseURL)/api/create-ai-sandbox")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.timeout
        
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatError.sandboxError("Invalid response")
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw ChatError.sandboxError("HTTP \(httpResponse.statusCode)")
        }
        
        let sandboxResponse = try decoder.decode(CreateSandboxResponse.self, from: data)
        
        return SandboxData(
            sandboxId: sandboxResponse.sandboxId,
            url: sandboxResponse.url,
            status: .created
        )
    }
    
    func destroySandbox(sandboxId: String) async throws {
        let request = DestroySandboxRequest(sandboxId: sandboxId)
        
        let url = URL(string: "\(APIConfig.baseURL)/api/kill-sandbox")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.timeout
        
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatError.sandboxError("Invalid response")
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw ChatError.sandboxError("HTTP \(httpResponse.statusCode)")
        }
    }
    
    func getSandboxFiles(sandboxId: String) async throws -> [SandboxFile] {
        let request = GetSandboxFilesRequest(sandboxId: sandboxId)
        
        let url = URL(string: "\(APIConfig.baseURL)/api/get-sandbox-files")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.timeout
        
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatError.sandboxError("Invalid response")
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw ChatError.sandboxError("HTTP \(httpResponse.statusCode)")
        }
        
        let filesResponse = try decoder.decode(GetSandboxFilesResponse.self, from: data)
        
        return filesResponse.files.map { fileData in
            let fileExtension = String(fileData.path.split(separator: ".").last ?? "")
            let fileType = FileType.from(extension: fileExtension)
            
            return SandboxFile(
                path: fileData.path,
                content: fileData.content,
                type: fileType
            )
        }
    }
    
    func applyCode(sandboxId: String, code: String) async throws {
        let request = ApplyCodeRequest(
            sandboxId: sandboxId,
            code: code
        )
        
        let url = URL(string: "\(APIConfig.baseURL)/api/apply-ai-code")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.timeout
        
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatError.sandboxError("Invalid response")
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw ChatError.sandboxError("HTTP \(httpResponse.statusCode)")
        }
    }
    
    func runCommand(sandboxId: String, command: String) async throws -> String {
        let request = RunCommandRequest(
            sandboxId: sandboxId,
            command: command
        )
        
        let url = URL(string: "\(APIConfig.baseURL)/api/run-command")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.timeoutInterval = APIConfig.timeout
        
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatError.sandboxError("Invalid response")
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw ChatError.sandboxError("HTTP \(httpResponse.statusCode)")
        }
        
        let commandResponse = try decoder.decode(RunCommandResponse.self, from: data)
        return commandResponse.output
    }
}

// MARK: - Request/Response Models

private struct CreateSandboxRequest: Codable {
    let template: String = "react-vite"
}

private struct CreateSandboxResponse: Codable {
    let sandboxId: String
    let url: String
}

private struct DestroySandboxRequest: Codable {
    let sandboxId: String
}

private struct GetSandboxFilesRequest: Codable {
    let sandboxId: String
}

private struct GetSandboxFilesResponse: Codable {
    let files: [SandboxFileData]
}

private struct SandboxFileData: Codable {
    let path: String
    let content: String
}

private struct ApplyCodeRequest: Codable {
    let sandboxId: String
    let code: String
}

private struct RunCommandRequest: Codable {
    let sandboxId: String
    let command: String
}

private struct RunCommandResponse: Codable {
    let output: String
}

// MARK: - Mock Implementation for Testing

final class MockSandboxManager: SandboxManagerProtocol {
    var shouldThrowError = false
    var mockSandboxData: SandboxData?
    var mockFiles: [SandboxFile] = []
    
    func createSandbox() async throws -> SandboxData {
        if shouldThrowError {
            throw ChatError.sandboxError("Mock sandbox creation error")
        }
        
        // Simulate creation delay
        try await Task.sleep(nanoseconds: 2_000_000_000)
        
        let sandbox = mockSandboxData ?? SandboxData(
            sandboxId: "mock-sandbox-\(UUID().uuidString.prefix(8))",
            url: "https://mock-sandbox.dev"
        )
        
        // Add some mock files
        mockFiles = [
            SandboxFile(path: "src/App.tsx", content: mockReactAppContent, type: .reactTypeScript),
            SandboxFile(path: "src/components/Button.tsx", content: mockButtonComponent, type: .reactTypeScript),
            SandboxFile(path: "src/styles/main.css", content: mockCSSContent, type: .css),
            SandboxFile(path: "package.json", content: mockPackageJson, type: .json)
        ]
        
        return sandbox
    }
    
    func destroySandbox(sandboxId: String) async throws {
        if shouldThrowError {
            throw ChatError.sandboxError("Mock sandbox destruction error")
        }
        
        // Simulate destruction delay
        try await Task.sleep(nanoseconds: 500_000_000)
        
        mockFiles.removeAll()
    }
    
    func getSandboxFiles(sandboxId: String) async throws -> [SandboxFile] {
        if shouldThrowError {
            throw ChatError.sandboxError("Mock get files error")
        }
        
        return mockFiles
    }
    
    func applyCode(sandboxId: String, code: String) async throws {
        if shouldThrowError {
            throw ChatError.sandboxError("Mock apply code error")
        }
        
        // Simulate code application delay
        try await Task.sleep(nanoseconds: 1_000_000_000)
        
        // Add the new code as a file
        let newFile = SandboxFile(
            path: "src/components/GeneratedComponent.tsx",
            content: code,
            type: .reactTypeScript
        )
        mockFiles.append(newFile)
    }
    
    func runCommand(sandboxId: String, command: String) async throws -> String {
        if shouldThrowError {
            throw ChatError.sandboxError("Mock command error")
        }
        
        // Simulate command execution delay
        try await Task.sleep(nanoseconds: 500_000_000)
        
        return "Mock command output for: \(command)"
    }
}

// MARK: - Mock Content

private let mockReactAppContent = """
import React from 'react';
import './styles/main.css';
import Button from './components/Button';

function App() {
  return (
    <div className="App">
      <h1>Welcome to Open Lovable</h1>
      <Button onClick={() => console.log('Clicked!')}>
        Click me!
      </Button>
    </div>
  );
}

export default App;
"""

private let mockButtonComponent = """
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
"""

private let mockCSSContent = """
.App {
  text-align: center;
  padding: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn:hover {
  opacity: 0.8;
}
"""

private let mockPackageJson = """
{
  "name": "open-lovable-sandbox",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "vite",
    "build": "vite build"
  }
}
"""