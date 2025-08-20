import SwiftUI

/// Settings and configuration view
struct SettingsView: View {
    let model: ChatViewModel
    @State private var isShowingAPIKeysSheet = false
    @State private var isShowingAboutSheet = false
    @AppStorage("isDarkModeEnabled") private var isDarkModeEnabled = false
    @AppStorage("isHapticsEnabled") private var isHapticsEnabled = true
    @AppStorage("autoScrollEnabled") private var autoScrollEnabled = true
    
    var body: some View {
        NavigationStack {
            Form {
                // AI Model Section
                aiModelSection
                
                // Appearance Section
                appearanceSection
                
                // Behavior Section
                behaviorSection
                
                // API Configuration Section
                apiConfigurationSection
                
                // About Section
                aboutSection
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $isShowingAPIKeysSheet) {
                APIKeysSheet()
            }
            .sheet(isPresented: $isShowingAboutSheet) {
                AboutSheet()
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Settings interface")
    }
    
    // MARK: - AI Model Section
    
    @ViewBuilder
    private var aiModelSection: some View {
        Section {
            ForEach(AIModel.availableModels) { aiModel in
                AIModelRow(
                    model: aiModel,
                    isSelected: aiModel.id == model.selectedAIModel.id
                ) {
                    model.selectAIModel(aiModel)
                }
            }
        } header: {
            Label("AI Model", systemImage: "brain.head.profile")
        } footer: {
            Text("Choose the AI model for code generation. Different models have different capabilities and costs.")
        }
    }
    
    // MARK: - Appearance Section
    
    @ViewBuilder
    private var appearanceSection: some View {
        Section {
            HStack {
                Label("Dark Mode", systemImage: "moon.fill")
                Spacer()
                Toggle("", isOn: $isDarkModeEnabled)
                    .accessibilityLabel("Dark mode toggle")
            }
        } header: {
            Label("Appearance", systemImage: "paintbrush")
        } footer: {
            Text("Customize the app's appearance to match your preferences.")
        }
    }
    
    // MARK: - Behavior Section
    
    @ViewBuilder
    private var behaviorSection: some View {
        Section {
            HStack {
                Label("Haptic Feedback", systemImage: "iphone.radiowaves.left.and.right")
                Spacer()
                Toggle("", isOn: $isHapticsEnabled)
                    .accessibilityLabel("Haptic feedback toggle")
            }
            
            HStack {
                Label("Auto-scroll Chat", systemImage: "arrow.down.circle")
                Spacer()
                Toggle("", isOn: $autoScrollEnabled)
                    .accessibilityLabel("Auto-scroll chat toggle")
            }
        } header: {
            Label("Behavior", systemImage: "gear")
        } footer: {
            Text("Configure app behavior and user experience preferences.")
        }
    }
    
    // MARK: - API Configuration Section
    
    @ViewBuilder
    private var apiConfigurationSection: some View {
        Section {
            Button {
                isShowingAPIKeysSheet = true
            } label: {
                Label("API Keys", systemImage: "key")
                    .foregroundStyle(.primary)
            }
            
            NavigationLink {
                UsageStatsView()
            } label: {
                Label("Usage Statistics", systemImage: "chart.bar")
            }
        } header: {
            Label("API Configuration", systemImage: "network")
        } footer: {
            Text("Manage your API keys and monitor usage across different AI providers.")
        }
    }
    
    // MARK: - About Section
    
    @ViewBuilder
    private var aboutSection: some View {
        Section {
            Button {
                isShowingAboutSheet = true
            } label: {
                Label("About Open Lovable", systemImage: "info.circle")
                    .foregroundStyle(.primary)
            }
            
            Link(destination: URL(string: "https://github.com/firecrawl/open-lovable")!) {
                Label("GitHub Repository", systemImage: "link")
            }
            
            Button("Clear All Data", role: .destructive) {
                clearAllData()
            }
            .foregroundStyle(.red)
        } header: {
            Label("About", systemImage: "questionmark.circle")
        } footer: {
            Text("Open Lovable v1.0.0 - Built with SwiftUI following best practices.")
        }
    }
    
    // MARK: - Helper Methods
    
    private func clearAllData() {
        model.clearMessages()
        Task {
            if model.sandboxData != nil {
                await model.destroySandbox()
            }
        }
    }
}

// MARK: - AI Model Row

struct AIModelRow: View {
    let model: AIModel
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(model.name)
                        .font(.body)
                        .foregroundStyle(.primary)
                    
                    Text(model.provider.displayName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    HStack {
                        ForEach(Array(model.capabilities.prefix(3)), id: \.self) { capability in
                            CapabilityBadge(capability: capability)
                        }
                        
                        if model.capabilities.count > 3 {
                            Text("+\(model.capabilities.count - 3)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("$\(model.costPer1KTokens, specifier: "%.4f")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text("per 1K tokens")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.blue)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(model.name) by \(model.provider.displayName)")
        .accessibilityValue(isSelected ? "Selected" : "Not selected")
        .accessibilityHint("Tap to select this AI model")
    }
}

// MARK: - Capability Badge

struct CapabilityBadge: View {
    let capability: AICapability
    
    var body: some View {
        Text(capability.displayName)
            .font(.caption2)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(.blue.opacity(0.1))
            .foregroundStyle(.blue)
            .clipShape(Capsule())
    }
}

// MARK: - API Keys Sheet

struct APIKeysSheet: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("openaiAPIKey") private var openaiAPIKey = ""
    @AppStorage("anthropicAPIKey") private var anthropicAPIKey = ""
    @AppStorage("googleAPIKey") private var googleAPIKey = ""
    @AppStorage("groqAPIKey") private var groqAPIKey = ""
    @State private var isShowingKeys = false
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("Show API Keys", isOn: $isShowingKeys)
                        .accessibilityLabel("Toggle API key visibility")
                } header: {
                    Text("Visibility")
                } footer: {
                    Text("Toggle to show or hide your API keys for security.")
                }
                
                Section {
                    APIKeyField(
                        title: "OpenAI",
                        key: $openaiAPIKey,
                        placeholder: "sk-...",
                        isSecure: !isShowingKeys
                    )
                    
                    APIKeyField(
                        title: "Anthropic",
                        key: $anthropicAPIKey,
                        placeholder: "sk-ant-...",
                        isSecure: !isShowingKeys
                    )
                    
                    APIKeyField(
                        title: "Google",
                        key: $googleAPIKey,
                        placeholder: "AIza...",
                        isSecure: !isShowingKeys
                    )
                    
                    APIKeyField(
                        title: "Groq",
                        key: $groqAPIKey,
                        placeholder: "gsk_...",
                        isSecure: !isShowingKeys
                    )
                } header: {
                    Text("API Keys")
                } footer: {
                    Text("Enter your API keys to enable AI functionality. Keys are stored securely on your device.")
                }
            }
            .navigationTitle("API Keys")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
        .accessibilityLabel("API keys configuration")
    }
}

// MARK: - API Key Field

struct APIKeyField: View {
    let title: String
    @Binding var key: String
    let placeholder: String
    let isSecure: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            
            if isSecure {
                SecureField(placeholder, text: $key)
                    .textContentType(.password)
            } else {
                TextField(placeholder, text: $key)
                    .textContentType(.none)
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title) API key")
    }
}

// MARK: - Usage Stats View

struct UsageStatsView: View {
    @State private var stats: [UsageStat] = []
    
    var body: some View {
        List {
            Section {
                ForEach(stats) { stat in
                    UsageStatRow(stat: stat)
                }
            } header: {
                Text("Current Month")
            } footer: {
                Text("Usage statistics are estimated based on token counts and model pricing.")
            }
        }
        .navigationTitle("Usage Statistics")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadUsageStats()
        }
        .refreshable {
            loadUsageStats()
        }
    }
    
    private func loadUsageStats() {
        // Mock data - in a real app, this would come from analytics/usage tracking
        stats = [
            UsageStat(provider: .openai, requests: 45, tokens: 125000, cost: 0.625),
            UsageStat(provider: .anthropic, requests: 32, tokens: 98000, cost: 0.294),
            UsageStat(provider: .google, requests: 18, tokens: 67000, cost: 0.084),
            UsageStat(provider: .groq, requests: 12, tokens: 45000, cost: 0.027)
        ]
    }
}

// MARK: - Usage Stat Row

struct UsageStatRow: View {
    let stat: UsageStat
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: stat.provider.iconName)
                    .foregroundStyle(.blue)
                
                Text(stat.provider.displayName)
                    .font(.headline)
                
                Spacer()
                
                Text("$\(stat.cost, specifier: "%.3f")")
                    .font(.headline)
                    .foregroundStyle(.green)
            }
            
            HStack {
                Label("\(stat.requests)", systemImage: "arrow.up.circle")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                Label("\(stat.tokens)", systemImage: "textformat")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(stat.provider.displayName) usage: \(stat.requests) requests, \(stat.tokens) tokens, $\(stat.cost, specifier: "%.3f")")
    }
}

// MARK: - About Sheet

struct AboutSheet: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // App Icon and Title
                    VStack(spacing: 16) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 80))
                            .foregroundStyle(.red)
                        
                        VStack(spacing: 8) {
                            Text("Open Lovable")
                                .font(.largeTitle.bold())
                            
                            Text("SwiftUI Edition")
                                .font(.title3)
                                .foregroundStyle(.secondary)
                            
                            Text("Version 1.0.0")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                    }
                    
                    // Description
                    VStack(alignment: .leading, spacing: 12) {
                        Text("About")
                            .font(.headline)
                        
                        Text("Open Lovable is an AI-powered code generation tool built with SwiftUI following modern iOS development best practices. Chat with AI to build applications instantly with full context awareness.")
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                    
                    // Features
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Features")
                            .font(.headline)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            FeatureRow(icon: "brain.head.profile", title: "Multiple AI Models", description: "Support for OpenAI, Anthropic, Google, and Groq")
                            FeatureRow(icon: "cube.transparent", title: "Sandbox Environment", description: "Safe code execution and file management")
                            FeatureRow(icon: "globe", title: "Web Scraping", description: "Extract content from websites for context")
                            FeatureRow(icon: "accessibility", title: "Accessibility First", description: "Full VoiceOver and Dynamic Type support")
                        }
                    }
                    
                    // Credits
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Credits")
                            .font(.headline)
                        
                        Text("Based on the original Open Lovable project by the Firecrawl team. Reimplemented in SwiftUI with modern iOS development practices.")
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding()
            }
            .navigationTitle("About")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Feature Row

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.blue)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.body.weight(.medium))
                
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - Supporting Types

struct UsageStat: Identifiable {
    let id = UUID()
    let provider: AIProvider
    let requests: Int
    let tokens: Int
    let cost: Double
}

// MARK: - Preview Providers

#Preview("Settings View") {
    SettingsView(model: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
}

#Preview("API Keys Sheet") {
    APIKeysSheet()
}

#Preview("About Sheet") {
    AboutSheet()
}

#Preview("Usage Stats View") {
    NavigationStack {
        UsageStatsView()
    }
}