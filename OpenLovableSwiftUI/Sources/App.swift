import SwiftUI

/// Main app entry point following SwiftUI best practices
@main
struct OpenLovableApp: App {
    // MARK: - App Storage
    @AppStorage("isDarkModeEnabled") private var isDarkModeEnabled = false
    @AppStorage("hasLaunchedBefore") private var hasLaunchedBefore = false
    
    // MARK: - State
    @State private var chatViewModel = ChatViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView(chatViewModel: chatViewModel)
                .preferredColorScheme(isDarkModeEnabled ? .dark : nil)
                .environment(\.dynamicTypeSize, .large) // Support Dynamic Type
                .onAppear {
                    setupAppearance()
                    handleFirstLaunch()
                }
        }
    }
    
    // MARK: - Setup Methods
    
    private func setupAppearance() {
        // Configure navigation bar appearance
        let appearance = UINavigationBarAppearance()
        appearance.configureWithDefaultBackground()
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        
        // Configure tab bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithDefaultBackground()
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
    }
    
    private func handleFirstLaunch() {
        if !hasLaunchedBefore {
            hasLaunchedBefore = true
            // Perform first-launch setup if needed
        }
    }
}

// MARK: - Environment Extension for Dependency Injection

extension EnvironmentValues {
    @Entry var chatViewModel: ChatViewModel = ChatViewModel()
}

// MARK: - Preview Provider

#Preview("App") {
    ContentView(chatViewModel: ChatViewModel(
        networkManager: MockNetworkManager(),
        sandboxManager: MockSandboxManager()
    ))
}