import SwiftUI

/// Sandbox management and file exploration view
struct SandboxView: View {
    let model: ChatViewModel
    @State private var selectedFile: SandboxFile?
    @State private var isShowingFileContent = false
    @State private var expandedFolders: Set<String> = ["src", "src/components"]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Sandbox Status
                sandboxStatusView
                
                Divider()
                
                // File Explorer
                if model.sandboxData != nil {
                    fileExplorerView
                } else {
                    emptyStateView
                }
            }
            .navigationTitle("Sandbox")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    if model.sandboxData != nil {
                        Button("Refresh", systemImage: "arrow.clockwise") {
                            Task {
                                await model.refreshSandboxFiles()
                            }
                        }
                        .disabled(model.isLoading)
                        
                        Menu {
                            Button("Destroy Sandbox", systemImage: "trash", role: .destructive) {
                                Task {
                                    await model.destroySandbox()
                                }
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    } else {
                        Button("Create Sandbox", systemImage: "plus.circle") {
                            Task {
                                await model.createSandbox()
                            }
                        }
                        .disabled(model.isLoading)
                    }
                }
            }
            .sheet(item: $selectedFile) { file in
                FileDetailSheet(file: file)
            }
        }
        .task {
            // Auto-refresh files when sandbox is available
            if model.sandboxData != nil && model.sandboxFiles.isEmpty {
                await model.refreshSandboxFiles()
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Sandbox management interface")
    }
    
    // MARK: - Sandbox Status View
    
    @ViewBuilder
    private var sandboxStatusView: some View {
        VStack(spacing: 12) {
            if let sandbox = model.sandboxData {
                SandboxStatusCard(sandbox: sandbox)
            } else {
                NoSandboxCard(isLoading: model.isLoading)
            }
            
            if model.isLoading {
                ProgressView()
                    .scaleEffect(0.8)
                    .accessibilityLabel("Loading")
            }
        }
        .padding()
        .background(.regularMaterial)
    }
    
    // MARK: - File Explorer View
    
    @ViewBuilder
    private var fileExplorerView: some View {
        if model.sandboxFiles.isEmpty && !model.isLoading {
            ContentUnavailableView(
                "No Files Found",
                systemImage: "doc.text",
                description: Text("The sandbox doesn't contain any files yet. Generate some code to see files here.")
            )
        } else {
            List {
                Section("Files") {
                    ForEach(organizedFiles.keys.sorted(), id: \.self) { folder in
                        FileSection(
                            title: folder,
                            files: organizedFiles[folder] ?? [],
                            isExpanded: expandedFolders.contains(folder),
                            onToggle: { toggleFolder(folder) },
                            onFileSelect: { file in
                                selectedFile = file
                            }
                        )
                    }
                }
            }
            .listStyle(.insetGrouped)
            .refreshable {
                await model.refreshSandboxFiles()
            }
        }
    }
    
    // MARK: - Empty State View
    
    @ViewBuilder
    private var emptyStateView: some View {
        ContentUnavailableView(
            "No Sandbox",
            systemImage: "cube.transparent",
            description: Text("Create a sandbox to start generating and managing code files.")
        ) {
            Button("Create Sandbox") {
                Task {
                    await model.createSandbox()
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(model.isLoading)
        }
    }
    
    // MARK: - Helper Properties
    
    private var organizedFiles: [String: [SandboxFile]] {
        Dictionary(grouping: model.sandboxFiles) { file in
            let pathComponents = file.path.split(separator: "/")
            if pathComponents.count > 1 {
                return String(pathComponents.dropLast().joined(separator: "/"))
            } else {
                return "Root"
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func toggleFolder(_ folder: String) {
        withAnimation(.easeInOut(duration: 0.2)) {
            if expandedFolders.contains(folder) {
                expandedFolders.remove(folder)
            } else {
                expandedFolders.insert(folder)
            }
        }
    }
}

// MARK: - Sandbox Status Card

struct SandboxStatusCard: View {
    let sandbox: SandboxData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "cube.fill")
                    .font(.title2)
                    .foregroundStyle(.blue)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Sandbox Active")
                        .font(.headline)
                        .foregroundStyle(.primary)
                    
                    Text("ID: \(sandbox.sandboxId)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                }
                
                Spacer()
                
                StatusBadge(status: sandbox.status)
            }
            
            HStack {
                Label("Created", systemImage: "calendar")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Text(sandbox.createdAt, style: .relative)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                if !sandbox.url.isEmpty {
                    Link(destination: URL(string: sandbox.url)!) {
                        Label("Open", systemImage: "arrow.up.right.square")
                            .font(.caption)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBlue).opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Sandbox status: Active")
        .accessibilityValue("ID: \(sandbox.sandboxId), Created \(sandbox.createdAt, style: .relative)")
    }
}

// MARK: - No Sandbox Card

struct NoSandboxCard: View {
    let isLoading: Bool
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "cube.transparent")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            
            VStack(spacing: 4) {
                Text("No Sandbox")
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Text(isLoading ? "Creating sandbox..." : "Create a sandbox to start coding")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .accessibilityLabel(isLoading ? "Creating sandbox" : "No sandbox available")
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: SandboxStatus
    
    var body: some View {
        Text(status.displayName)
            .font(.caption.weight(.medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.2))
            .foregroundStyle(statusColor)
            .clipShape(Capsule())
            .accessibilityLabel("Status: \(status.displayName)")
    }
    
    private var statusColor: Color {
        switch status {
        case .creating: return .orange
        case .created: return .blue
        case .running: return .green
        case .stopped: return .yellow
        case .error: return .red
        case .destroyed: return .gray
        }
    }
}

// MARK: - File Section

struct FileSection: View {
    let title: String
    let files: [SandboxFile]
    let isExpanded: Bool
    let onToggle: () -> Void
    let onFileSelect: (SandboxFile) -> Void
    
    var body: some View {
        DisclosureGroup(
            isExpanded: Binding(
                get: { isExpanded },
                set: { _ in onToggle() }
            )
        ) {
            ForEach(files.sorted(by: { $0.fileName < $1.fileName })) { file in
                FileRow(file: file) {
                    onFileSelect(file)
                }
            }
        } label: {
            HStack {
                Image(systemName: isExpanded ? "folder.fill" : "folder")
                    .foregroundStyle(.blue)
                
                Text(title.isEmpty ? "Root" : title)
                    .font(.headline)
                
                Spacer()
                
                Text("\(files.count)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(.secondary.opacity(0.2))
                    .clipShape(Capsule())
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title) folder with \(files.count) files")
        .accessibilityHint(isExpanded ? "Tap to collapse" : "Tap to expand")
    }
}

// MARK: - File Row

struct FileRow: View {
    let file: SandboxFile
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: file.type.iconName)
                    .font(.body)
                    .foregroundStyle(fileColor)
                    .frame(width: 20)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(file.fileName)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    
                    Text("Modified \(file.lastModified, style: .relative)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("File: \(file.fileName)")
        .accessibilityHint("Tap to view file content")
    }
    
    private var fileColor: Color {
        switch file.type {
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

// MARK: - File Detail Sheet

struct FileDetailSheet: View {
    let file: SandboxFile
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // File Info
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: file.type.iconName)
                                .foregroundStyle(fileColor)
                            
                            Text(file.fileName)
                                .font(.headline)
                        }
                        
                        Text(file.path)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                        
                        Text("Last modified: \(file.lastModified, style: .date)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(.regularMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    
                    // File Content
                    CodeBlock(code: file.content, language: file.type.rawValue)
                }
                .padding()
            }
            .navigationTitle("File Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .accessibilityLabel("File details for \(file.fileName)")
    }
    
    private var fileColor: Color {
        switch file.type {
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

#Preview("Sandbox View - With Sandbox") {
    let viewModel = ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    )
    
    return SandboxView(model: viewModel)
        .task {
            await viewModel.createSandbox()
            await viewModel.refreshSandboxFiles()
        }
}

#Preview("Sandbox View - Empty") {
    SandboxView(model: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
}

#Preview("File Detail Sheet") {
    let sampleFile = SandboxFile(
        path: "src/components/Button.tsx",
        content: """
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
        """,
        type: .reactTypeScript
    )
    
    return FileDetailSheet(file: sampleFile)
}