# Open Lovable SwiftUI

A modern SwiftUI implementation of the Open Lovable AI-powered code generation app, built following iOS development best practices.

## Overview

Open Lovable SwiftUI is a native iOS application that allows you to chat with AI to build applications instantly. This implementation follows SwiftUI best practices including proper state management with the Observation framework, accessibility support, and performance optimization.

## Features

### Core Functionality
- **AI Chat Interface**: Interactive chat with multiple AI models (OpenAI, Anthropic, Google, Groq)
- **Sandbox Management**: Create and manage code execution sandboxes
- **File Explorer**: Browse and view generated code files
- **Web Scraping**: Extract content from websites for design inspiration
- **Real-time Code Generation**: Generate SwiftUI code with context awareness

### Technical Highlights
- **Modern Architecture**: Uses `@Observable` macro for state management
- **Proper Data Flow**: Follows SwiftUI best practices for parent-child communication
- **Accessibility First**: Full VoiceOver support and Dynamic Type compatibility
- **Performance Optimized**: Lazy loading, efficient state updates, and memory management
- **Comprehensive Testing**: Unit tests with Swift Testing framework
- **Mock Services**: Complete mock implementations for development and testing

## Architecture

### State Management
```swift
@Observable
final class ChatViewModel {
    // Uses @Observable macro for reactive UI updates
    // Proper separation of concerns
    // Protocol-based dependency injection
}
```

### View Structure
```
ContentView (TabView)
├── ChatView (AI conversation)
├── SandboxView (File management)
└── SettingsView (Configuration)
```

### Service Layer
- `NetworkManager`: Handles AI API communications
- `SandboxManager`: Manages code execution environments
- Mock implementations for testing and development

## SwiftUI Best Practices Implemented

### 1. State Management
- ✅ Uses `@Observable` for view models
- ✅ Avoids `@State` for view model observation
- ✅ Proper use of `@Binding` for two-way data flow
- ✅ `@Environment` for app-wide dependencies
- ✅ Local `@State` only for view-specific state

### 2. Performance Optimization
- ✅ Lazy loading with `LazyVStack` and `LazyVGrid`
- ✅ Stable identifiers in `ForEach` loops
- ✅ Efficient list rendering with proper data structures
- ✅ Memory-conscious image handling

### 3. Reusable Components
- ✅ Custom view modifiers for shared styling
- ✅ Extensions for common functionality
- ✅ Protocol-based architecture for testability
- ✅ Composable UI components

### 4. Accessibility
- ✅ Comprehensive accessibility labels and hints
- ✅ Dynamic Type support throughout the app
- ✅ VoiceOver navigation optimization
- ✅ Semantic accessibility traits

### 5. SwiftUI Lifecycle
- ✅ `@main` and `App` protocol entry point
- ✅ Proper scene management
- ✅ Lifecycle methods (`onAppear`, `onDisappear`)
- ✅ Task-based async operations

### 6. Data Flow
- ✅ Observation framework integration
- ✅ Proper error handling and propagation
- ✅ Reactive UI updates
- ✅ Clean separation of concerns

### 7. Testing
- ✅ Comprehensive unit tests with Swift Testing
- ✅ Mock services for isolated testing
- ✅ Preview providers for all views
- ✅ Integration test scenarios

### 8. Code Style
- ✅ Swift style guidelines adherence
- ✅ Consistent naming conventions
- ✅ Proper documentation and comments
- ✅ MARK comments for organization

## Project Structure

```
OpenLovableSwiftUI/
├── Sources/
│   ├── App.swift                 # App entry point
│   ├── Models/                   # Data models
│   │   ├── ChatMessage.swift
│   │   ├── SandboxData.swift
│   │   └── AIModel.swift
│   ├── ViewModels/               # Observable view models
│   │   └── ChatViewModel.swift
│   ├── Views/                    # SwiftUI views
│   │   ├── ContentView.swift
│   │   ├── ChatView.swift
│   │   ├── SandboxView.swift
│   │   ├── SettingsView.swift
│   │   └── Components/
│   │       ├── CodeBlock.swift
│   │       └── Extensions.swift
│   └── Services/                 # Business logic
│       ├── NetworkManager.swift
│       └── SandboxManager.swift
├── Tests/                        # Unit tests
│   ├── ChatViewModelTests.swift
│   └── NetworkManagerTests.swift
├── Package.swift                 # Swift Package Manager
└── README.md
```

## Getting Started

### Prerequisites
- iOS 17.0+ / macOS 14.0+
- Xcode 15.0+
- Swift 5.9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/OpenLovableSwiftUI.git
   cd OpenLovableSwiftUI
   ```

2. **Open in Xcode**
   ```bash
   open Package.swift
   ```

3. **Configure API Keys**
   - Run the app and go to Settings > API Keys
   - Add your API keys for the AI services you want to use:
     - OpenAI API Key
     - Anthropic API Key
     - Google API Key
     - Groq API Key

4. **Build and Run**
   - Select your target device/simulator
   - Press Cmd+R to build and run

### Running Tests

```bash
# Run all tests
swift test

# Run specific test suite
swift test --filter ChatViewModelTests
```

## Configuration

### AI Models
The app supports multiple AI providers:

- **OpenAI GPT-4o**: Best for general code generation
- **Anthropic Claude 3.5 Sonnet**: Excellent for complex reasoning (default)
- **Google Gemini 1.5 Pro**: Long context support
- **Groq Llama 3.1 70B**: Fast inference

### Settings
- **Dark Mode**: Toggle between light and dark themes
- **Haptic Feedback**: Enable/disable haptic responses
- **Auto-scroll Chat**: Automatically scroll to new messages
- **API Key Management**: Securely store API credentials

## Development

### Adding New Features

1. **Create Models**: Add data structures in `Models/`
2. **Update View Models**: Extend `ChatViewModel` or create new observable classes
3. **Build Views**: Create SwiftUI views following the established patterns
4. **Add Tests**: Write unit tests for new functionality
5. **Update Documentation**: Keep README and code comments current

### Best Practices Checklist

- [ ] Use `@Observable` for view models
- [ ] Add accessibility labels and hints
- [ ] Support Dynamic Type
- [ ] Include preview providers
- [ ] Write unit tests
- [ ] Follow Swift naming conventions
- [ ] Add proper error handling
- [ ] Optimize for performance
- [ ] Use protocol-based architecture

### Mock Services

The app includes comprehensive mock services for development:

```swift
let viewModel = ChatViewModel(
    networkManager: MockNetworkManager(),
    sandboxManager: MockSandboxManager()
)
```

This allows for:
- Offline development
- Predictable testing scenarios
- UI iteration without API calls
- Demo mode functionality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the SwiftUI best practices outlined above
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Review Checklist

- [ ] Follows SwiftUI best practices
- [ ] Includes comprehensive tests
- [ ] Has proper accessibility support
- [ ] Uses consistent naming conventions
- [ ] Includes preview providers
- [ ] Handles errors gracefully
- [ ] Is performance optimized
- [ ] Has clear documentation

## Performance Considerations

### Memory Management
- Uses weak references where appropriate
- Implements proper cleanup in view lifecycle
- Optimizes image loading and caching
- Monitors memory usage in development builds

### UI Performance
- Lazy loading for large lists
- Efficient state updates
- Minimal view re-renders
- Proper use of `@Observable` for reactive updates

### Network Optimization
- Request timeout handling
- Proper error recovery
- Efficient JSON parsing
- Background task management

## Accessibility Features

### VoiceOver Support
- Semantic labels for all interactive elements
- Proper navigation order
- Custom accessibility actions
- Screen reader announcements

### Dynamic Type
- Scales with system font size preferences
- Maintains layout integrity at all sizes
- Uses semantic font styles
- Tests with accessibility sizes

### Additional Features
- High contrast support
- Reduce motion preferences
- Voice control compatibility
- Switch control support

## Security

### API Key Storage
- Keys stored in iOS Keychain
- No keys in source code or logs
- Secure transmission over HTTPS
- User-controlled key management

### Data Privacy
- No personal data collection
- Local conversation storage
- User-controlled data clearing
- Transparent privacy practices

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the original [Open Lovable](https://github.com/firecrawl/open-lovable) project by the Firecrawl team
- Built with SwiftUI following Apple's design guidelines
- Implements modern iOS development best practices
- Uses the latest Swift and SwiftUI features

## Support

For support, please:
1. Check the documentation above
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Follow the issue template for bug reports

## Roadmap

### Upcoming Features
- [ ] iPad optimization with split-view support
- [ ] macOS companion app
- [ ] Offline mode with local AI models
- [ ] Plugin system for custom AI providers
- [ ] Advanced code editing capabilities
- [ ] Project templates and scaffolding
- [ ] Collaboration features
- [ ] Export to Xcode projects

### Performance Improvements
- [ ] Advanced caching strategies
- [ ] Background processing optimization
- [ ] Memory usage reduction
- [ ] Startup time improvements

---

Built with ❤️ using SwiftUI and following iOS development best practices.