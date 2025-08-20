import SwiftUI

/// Main content view of the application
struct ContentView: View {
    let chatViewModel: ChatViewModel
    @State private var selectedTab = 0
    
    init(chatViewModel: ChatViewModel = ChatViewModel()) {
        self.chatViewModel = chatViewModel
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ChatView(model: chatViewModel)
                .tabItem {
                    Label("Chat", systemImage: "bubble.left.and.bubble.right")
                }
                .tag(0)
            
            SandboxView(model: chatViewModel)
                .tabItem {
                    Label("Sandbox", systemImage: "cube.transparent")
                }
                .tag(1)
            
            SettingsView(model: chatViewModel)
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(2)
        }
        .tint(.blue)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Main navigation")
    }
}

// MARK: - Preview Provider

#Preview("Content View") {
    ContentView(chatViewModel: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
}

#Preview("Content View - Dark Mode") {
    ContentView(chatViewModel: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
    .preferredColorScheme(.dark)
}

#Preview("Content View - Large Text") {
    ContentView(chatViewModel: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
    .environment(\.dynamicTypeSize, .accessibility3)
}