import SwiftUI

/// Chat interface view with AI conversation
struct ChatView: View {
    let model: ChatViewModel
    @State private var isShowingURLInput = false
    @FocusState private var isMessageInputFocused: Bool
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Chat Messages
                chatMessagesView
                
                Divider()
                
                // Input Section
                chatInputView
            }
            .navigationTitle("AI Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("Scrape URL", systemImage: "globe") {
                            isShowingURLInput = true
                        }
                        
                        Button("Clear Messages", systemImage: "trash", role: .destructive) {
                            model.clearMessages()
                        }
                        
                        Divider()
                        
                        AIModelPicker(selectedModel: model.selectedAIModel) { newModel in
                            model.selectAIModel(newModel)
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .accessibilityLabel("Chat options")
                    }
                }
            }
            .sheet(isPresented: $isShowingURLInput) {
                URLInputSheet(model: model)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("AI Chat Interface")
    }
    
    // MARK: - Chat Messages View
    
    @ViewBuilder
    private var chatMessagesView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(model.messages) { message in
                        ChatMessageRow(message: message)
                            .id(message.id)
                    }
                    
                    if model.isLoading {
                        LoadingMessageRow()
                            .id("loading")
                    }
                }
                .padding()
            }
            .onChange(of: model.messages.count) { _, _ in
                withAnimation(.easeOut(duration: 0.3)) {
                    if model.isLoading {
                        proxy.scrollTo("loading", anchor: .bottom)
                    } else if let lastMessage = model.messages.last {
                        proxy.scrollTo(lastMessage.id, anchor: .bottom)
                    }
                }
            }
        }
        .background(Color(.systemGroupedBackground))
    }
    
    // MARK: - Chat Input View
    
    @ViewBuilder
    private var chatInputView: some View {
        VStack(spacing: 12) {
            if let error = model.error {
                ErrorBanner(error: error)
            }
            
            HStack(alignment: .bottom, spacing: 12) {
                TextField("Type your message...", text: $model.messageInput, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...5)
                    .focused($isMessageInputFocused)
                    .onSubmit {
                        if !model.isLoading {
                            Task {
                                await model.sendMessage()
                            }
                        }
                    }
                    .accessibilityLabel("Message input")
                    .accessibilityHint("Type your message to the AI assistant")
                
                Button {
                    isMessageInputFocused = false
                    Task {
                        await model.sendMessage()
                    }
                } label: {
                    Image(systemName: model.isLoading ? "stop.circle.fill" : "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(model.messageInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .secondary : .blue)
                }
                .disabled(model.messageInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .accessibilityLabel(model.isLoading ? "Stop generation" : "Send message")
            }
        }
        .padding()
        .background(.regularMaterial)
    }
}

// MARK: - Chat Message Row

struct ChatMessageRow: View {
    let message: ChatMessage
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Message Icon
            Image(systemName: message.type.iconName)
                .font(.title3)
                .foregroundStyle(iconColor)
                .frame(width: 24, height: 24)
                .accessibilityHidden(true)
            
            VStack(alignment: .leading, spacing: 8) {
                // Header
                HStack {
                    Text(message.type.displayName)
                        .font(.headline)
                        .foregroundStyle(iconColor)
                    
                    Spacer()
                    
                    Text(message.timestamp, style: .time)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                // Content
                Text(message.content)
                    .font(.body)
                    .textSelection(.enabled)
                
                // Code Block (if present)
                if let code = message.metadata?.generatedCode {
                    CodeBlock(code: code)
                }
                
                // Applied Files (if present)
                if let files = message.metadata?.appliedFiles, !files.isEmpty {
                    AppliedFilesView(files: files)
                }
            }
        }
        .padding()
        .background(backgroundColor)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(message.type.displayName) message")
        .accessibilityValue(message.content)
    }
    
    private var iconColor: Color {
        switch message.type {
        case .user: return .blue
        case .ai: return .green
        case .system: return .orange
        case .fileUpdate: return .purple
        case .command: return .gray
        case .error: return .red
        }
    }
    
    private var backgroundColor: Color {
        switch message.type {
        case .user: return Color(.systemBlue).opacity(0.1)
        case .ai: return Color(.systemGreen).opacity(0.1)
        case .system: return Color(.systemOrange).opacity(0.1)
        case .fileUpdate: return Color(.systemPurple).opacity(0.1)
        case .command: return Color(.systemGray).opacity(0.1)
        case .error: return Color(.systemRed).opacity(0.1)
        }
    }
}

// MARK: - Loading Message Row

struct LoadingMessageRow: View {
    @State private var animationPhase = 0.0
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "brain.head.profile")
                .font(.title3)
                .foregroundStyle(.green)
                .frame(width: 24, height: 24)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("AI Assistant")
                    .font(.headline)
                    .foregroundStyle(.green)
                
                HStack(spacing: 4) {
                    ForEach(0..<3) { index in
                        Circle()
                            .fill(.secondary)
                            .frame(width: 8, height: 8)
                            .scaleEffect(animationPhase == Double(index) ? 1.2 : 1.0)
                            .animation(
                                .easeInOut(duration: 0.6)
                                .repeatForever()
                                .delay(Double(index) * 0.2),
                                value: animationPhase
                            )
                    }
                }
                .onAppear {
                    animationPhase = 1.0
                }
            }
        }
        .padding()
        .background(Color(.systemGreen).opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .accessibilityLabel("AI is thinking")
    }
}

// MARK: - Error Banner

struct ErrorBanner: View {
    let error: ChatError
    
    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)
            
            Text(error.localizedDescription)
                .font(.caption)
                .foregroundStyle(.red)
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(.systemRed).opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityLabel("Error: \(error.localizedDescription)")
    }
}

// MARK: - AI Model Picker

struct AIModelPicker: View {
    let selectedModel: AIModel
    let onModelChange: (AIModel) -> Void
    
    var body: some View {
        Menu {
            ForEach(AIModel.availableModels) { model in
                Button {
                    onModelChange(model)
                } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(model.name)
                            Text(model.provider.displayName)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        
                        if model.id == selectedModel.id {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            Label("AI Model: \(selectedModel.name)", systemImage: selectedModel.provider.iconName)
        }
    }
}

// MARK: - URL Input Sheet

struct URLInputSheet: View {
    let model: ChatViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                TextField("Enter URL to scrape", text: $model.urlInput)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.URL)
                    .textContentType(.URL)
                    .autocapitalization(.none)
                
                Button("Scrape URL") {
                    Task {
                        await model.scrapeUrl()
                        dismiss()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(model.urlInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || model.isLoading)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Scrape URL")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .accessibilityLabel("URL scraping interface")
    }
}

// MARK: - Preview Providers

#Preview("Chat View") {
    ChatView(model: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
}

#Preview("Chat View - Dark Mode") {
    ChatView(model: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
    .preferredColorScheme(.dark)
}

#Preview("Loading State") {
    let viewModel = ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    )
    
    return ChatView(model: viewModel)
        .onAppear {
            // Simulate loading state
            Task {
                await MainActor.run {
                    viewModel.messageInput = "Test message"
                }
                await viewModel.sendMessage()
            }
        }
}