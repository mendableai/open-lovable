import SwiftUI

/// A view that displays code with syntax highlighting and copy functionality
struct CodeBlock: View {
    let code: String
    let language: String
    @State private var isCopied = false
    
    init(code: String, language: String = "swift") {
        self.code = code
        self.language = language
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header with language and copy button
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: languageIcon)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text(language.uppercased())
                        .font(.caption.monospaced())
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Button {
                    copyToClipboard()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                            .font(.caption)
                        
                        Text(isCopied ? "Copied!" : "Copy")
                            .font(.caption)
                    }
                    .foregroundStyle(isCopied ? .green : .secondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Copy code to clipboard")
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.regularMaterial)
            
            // Code content
            ScrollView(.horizontal, showsIndicators: false) {
                Text(code)
                    .font(.system(.body, design: .monospaced))
                    .textSelection(.enabled)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Color(.systemGray6))
            .overlay(
                RoundedRectangle(cornerRadius: 0)
                    .stroke(Color(.separator), lineWidth: 0.5)
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color(.separator), lineWidth: 0.5)
        )
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Code block in \(language)")
        .accessibilityValue(code)
    }
    
    private var languageIcon: String {
        switch language.lowercased() {
        case "swift": return "swift"
        case "javascript", "js": return "curlybraces"
        case "typescript", "ts": return "curlybraces"
        case "python": return "snake.fill"
        case "html": return "globe"
        case "css": return "paintbrush"
        case "json": return "doc.text"
        case "xml": return "doc.text"
        default: return "curlybraces"
        }
    }
    
    private func copyToClipboard() {
        #if os(iOS)
        UIPasteboard.general.string = code
        #elseif os(macOS)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(code, forType: .string)
        #endif
        
        withAnimation(.easeInOut(duration: 0.2)) {
            isCopied = true
        }
        
        // Reset the copied state after 2 seconds
        Task {
            try await Task.sleep(nanoseconds: 2_000_000_000)
            await MainActor.run {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isCopied = false
                }
            }
        }
    }
}

// MARK: - Applied Files View

struct AppliedFilesView: View {
    let files: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "doc.text")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Text("Applied to files:")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 150), spacing: 8)
            ], spacing: 8) {
                ForEach(files, id: \.self) { file in
                    FileTag(fileName: file)
                }
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Code applied to \(files.count) files")
    }
}

// MARK: - File Tag

struct FileTag: View {
    let fileName: String
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: fileIcon)
                .font(.caption2)
                .foregroundStyle(fileColor)
            
            Text(fileName)
                .font(.caption)
                .lineLimit(1)
                .truncationMode(.middle)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(fileColor.opacity(0.1))
        .clipShape(Capsule())
        .accessibilityLabel("File: \(fileName)")
    }
    
    private var fileIcon: String {
        let fileExtension = String(fileName.split(separator: ".").last ?? "")
        let fileType = FileType.from(extension: fileExtension)
        return fileType.iconName
    }
    
    private var fileColor: Color {
        let fileExtension = String(fileName.split(separator: ".").last ?? "")
        let fileType = FileType.from(extension: fileExtension)
        
        switch fileType {
        case .javascript: return .yellow
        case .typescript: return .blue
        case .react, .reactTypeScript: return .cyan
        case .css: return .purple
        case .html: return .orange
        case .json: return .green
        case .markdown: return .gray
        case .text: return .gray
        case .other: return .gray
        }
    }
}

// MARK: - Preview Providers

#Preview("Code Block - Swift") {
    VStack(spacing: 20) {
        CodeBlock(
            code: """
            import SwiftUI

            struct ContentView: View {
                @State private var message = "Hello, World!"
                
                var body: some View {
                    VStack {
                        Text(message)
                            .font(.largeTitle)
                            .foregroundStyle(.blue)
                        
                        Button("Change Message") {
                            message = "Button tapped!"
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                }
            }
            """,
            language: "swift"
        )
        
        Spacer()
    }
    .padding()
}

#Preview("Code Block - JavaScript") {
    VStack(spacing: 20) {
        CodeBlock(
            code: """
            import React, { useState } from 'react';

            function Counter() {
              const [count, setCount] = useState(0);

              return (
                <div>
                  <p>You clicked {count} times</p>
                  <button onClick={() => setCount(count + 1)}>
                    Click me
                  </button>
                </div>
              );
            }

            export default Counter;
            """,
            language: "javascript"
        )
        
        Spacer()
    }
    .padding()
}

#Preview("Applied Files View") {
    VStack(spacing: 20) {
        AppliedFilesView(files: [
            "src/ContentView.swift",
            "src/Components/Button.swift",
            "src/ViewModels/ChatViewModel.swift",
            "src/Services/NetworkManager.swift"
        ])
        
        Spacer()
    }
    .padding()
}