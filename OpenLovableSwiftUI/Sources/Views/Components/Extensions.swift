import SwiftUI

// MARK: - View Extensions for Reusable Functionality

extension View {
    /// Applies a loading overlay when the condition is true
    func loadingOverlay(_ isLoading: Bool) -> some View {
        self.overlay {
            if isLoading {
                Color.black.opacity(0.3)
                    .overlay {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .scaleEffect(1.2)
                    }
                    .transition(.opacity)
            }
        }
    }
    
    /// Adds haptic feedback on tap
    func hapticFeedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) -> some View {
        self.onTapGesture {
            let impactFeedback = UIImpactFeedbackGenerator(style: style)
            impactFeedback.impactOccurred()
        }
    }
    
    /// Adds a custom shadow effect
    func customShadow(
        color: Color = .black,
        radius: CGFloat = 8,
        x: CGFloat = 0,
        y: CGFloat = 2
    ) -> some View {
        self.shadow(color: color.opacity(0.1), radius: radius, x: x, y: y)
    }
    
    /// Adds a bordered style commonly used in the app
    func appBorderStyle(
        cornerRadius: CGFloat = 12,
        borderColor: Color = .secondary,
        borderWidth: CGFloat = 0.5
    ) -> some View {
        self
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(borderColor.opacity(0.3), lineWidth: borderWidth)
            )
    }
    
    /// Adds accessibility improvements for better VoiceOver support
    func enhancedAccessibility(
        label: String,
        hint: String? = nil,
        value: String? = nil,
        traits: AccessibilityTraits = []
    ) -> some View {
        self
            .accessibilityLabel(label)
            .accessibilityHint(hint ?? "")
            .accessibilityValue(value ?? "")
            .accessibilityAddTraits(traits)
    }
    
    /// Applies conditional modifiers based on a boolean condition
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
    
    /// Applies different modifiers based on iOS version
    @available(iOS 17.0, *)
    func modernScrollBehavior() -> some View {
        self.scrollBounceBehavior(.basedOnSize)
    }
    
    /// Adds a gradient background
    func gradientBackground(
        colors: [Color] = [.blue.opacity(0.1), .purple.opacity(0.1)],
        startPoint: UnitPoint = .topLeading,
        endPoint: UnitPoint = .bottomTrailing
    ) -> some View {
        self.background(
            LinearGradient(
                colors: colors,
                startPoint: startPoint,
                endPoint: endPoint
            )
        )
    }
}

// MARK: - Color Extensions

extension Color {
    /// App-specific color palette
    static let appPrimary = Color.blue
    static let appSecondary = Color.purple
    static let appAccent = Color.green
    
    /// Dynamic colors that adapt to light/dark mode
    static let dynamicBackground = Color(.systemBackground)
    static let dynamicSecondaryBackground = Color(.secondarySystemBackground)
    static let dynamicTertiaryBackground = Color(.tertiarySystemBackground)
    
    /// Semantic colors for different states
    static let successColor = Color.green
    static let warningColor = Color.orange
    static let errorColor = Color.red
    static let infoColor = Color.blue
    
    /// Creates a color from hex string
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - String Extensions

extension String {
    /// Validates if string is a valid URL
    var isValidURL: Bool {
        URL(string: self) != nil
    }
    
    /// Truncates string to specified length with ellipsis
    func truncated(to length: Int, trailing: String = "...") -> String {
        if self.count <= length {
            return self
        } else {
            return String(self.prefix(length)) + trailing
        }
    }
    
    /// Removes leading and trailing whitespace and newlines
    var trimmed: String {
        self.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    /// Converts string to title case
    var titleCased: String {
        return self.split(separator: " ")
            .map { $0.capitalized }
            .joined(separator: " ")
    }
}

// MARK: - Date Extensions

extension Date {
    /// Returns a relative time string (e.g., "2 minutes ago")
    var relativeTimeString: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: self, relativeTo: Date())
    }
    
    /// Returns a formatted string for display
    func formatted(style: DateFormatter.Style = .medium) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = style
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }
    
    /// Checks if date is today
    var isToday: Bool {
        Calendar.current.isDateInToday(self)
    }
    
    /// Checks if date is yesterday
    var isYesterday: Bool {
        Calendar.current.isDateInYesterday(self)
    }
}

// MARK: - Array Extensions

extension Array where Element: Identifiable {
    /// Safely removes an element by ID
    mutating func remove(withId id: Element.ID) {
        self.removeAll { $0.id == id }
    }
    
    /// Finds an element by ID
    func first(withId id: Element.ID) -> Element? {
        self.first { $0.id == id }
    }
    
    /// Updates an element by ID
    mutating func update(_ element: Element) {
        if let index = self.firstIndex(where: { $0.id == element.id }) {
            self[index] = element
        }
    }
}

// MARK: - Custom View Modifiers

struct CardStyle: ViewModifier {
    let backgroundColor: Color
    let cornerRadius: CGFloat
    let shadowRadius: CGFloat
    
    init(
        backgroundColor: Color = .dynamicSecondaryBackground,
        cornerRadius: CGFloat = 12,
        shadowRadius: CGFloat = 4
    ) {
        self.backgroundColor = backgroundColor
        self.cornerRadius = cornerRadius
        self.shadowRadius = shadowRadius
    }
    
    func body(content: Content) -> some View {
        content
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .customShadow(radius: shadowRadius)
    }
}

struct PulseEffect: ViewModifier {
    @State private var isAnimating = false
    let duration: Double
    let minOpacity: Double
    let maxOpacity: Double
    
    init(duration: Double = 1.0, minOpacity: Double = 0.5, maxOpacity: Double = 1.0) {
        self.duration = duration
        self.minOpacity = minOpacity
        self.maxOpacity = maxOpacity
    }
    
    func body(content: Content) -> some View {
        content
            .opacity(isAnimating ? minOpacity : maxOpacity)
            .animation(
                .easeInOut(duration: duration).repeatForever(autoreverses: true),
                value: isAnimating
            )
            .onAppear {
                isAnimating = true
            }
    }
}

struct ShakeEffect: ViewModifier {
    @State private var shakeOffset: CGFloat = 0
    let trigger: Bool
    
    func body(content: Content) -> some View {
        content
            .offset(x: shakeOffset)
            .onChange(of: trigger) { _, newValue in
                if newValue {
                    withAnimation(.easeInOut(duration: 0.1).repeatCount(6, autoreverses: true)) {
                        shakeOffset = 10
                    }
                    
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                        shakeOffset = 0
                    }
                }
            }
    }
}

// MARK: - View Modifier Extensions

extension View {
    func cardStyle(
        backgroundColor: Color = .dynamicSecondaryBackground,
        cornerRadius: CGFloat = 12,
        shadowRadius: CGFloat = 4
    ) -> some View {
        self.modifier(CardStyle(
            backgroundColor: backgroundColor,
            cornerRadius: cornerRadius,
            shadowRadius: shadowRadius
        ))
    }
    
    func pulseEffect(
        duration: Double = 1.0,
        minOpacity: Double = 0.5,
        maxOpacity: Double = 1.0
    ) -> some View {
        self.modifier(PulseEffect(
            duration: duration,
            minOpacity: minOpacity,
            maxOpacity: maxOpacity
        ))
    }
    
    func shakeEffect(trigger: Bool) -> some View {
        self.modifier(ShakeEffect(trigger: trigger))
    }
}

// MARK: - Environment Extensions

extension EnvironmentValues {
    @Entry var isPreview: Bool = false
}

// MARK: - Preview Extensions

extension View {
    func previewDevice(_ deviceName: String) -> some View {
        self.environment(\.isPreview, true)
            .previewDevice(PreviewDevice(rawValue: deviceName))
    }
    
    func previewWithAllSizes() -> some View {
        Group {
            self
                .previewDevice("iPhone 15 Pro")
                .previewDisplayName("iPhone 15 Pro")
            
            self
                .previewDevice("iPhone SE (3rd generation)")
                .previewDisplayName("iPhone SE")
            
            self
                .previewDevice("iPad Pro (12.9-inch) (6th generation)")
                .previewDisplayName("iPad Pro")
        }
        .environment(\.isPreview, true)
    }
}

// MARK: - Performance Helpers

extension View {
    /// Adds performance monitoring for debugging
    func measurePerformance(_ label: String = "View") -> some View {
        self.onAppear {
            let startTime = CFAbsoluteTimeGetCurrent()
            DispatchQueue.main.async {
                let timeElapsed = CFAbsoluteTimeGetCurrent() - startTime
                print("⏱ \(label) render time: \(String(format: "%.4f", timeElapsed))s")
            }
        }
    }
    
    /// Adds memory usage tracking for debugging
    func trackMemoryUsage(_ label: String = "View") -> some View {
        self.onAppear {
            let memoryUsage = mach_task_basic_info()
            var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4
            
            let kerr: kern_return_t = withUnsafeMutablePointer(to: &memoryUsage) {
                $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                    task_info(mach_task_self_,
                             task_flavor_t(MACH_TASK_BASIC_INFO),
                             $0,
                             &count)
                }
            }
            
            if kerr == KERN_SUCCESS {
                let memoryMB = Double(memoryUsage.resident_size) / 1024 / 1024
                print("📱 \(label) memory usage: \(String(format: "%.2f", memoryMB)) MB")
            }
        }
    }
}