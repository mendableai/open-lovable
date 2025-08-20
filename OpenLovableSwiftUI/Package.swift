// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "OpenLovableSwiftUI",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "OpenLovableSwiftUI",
            targets: ["OpenLovableSwiftUI"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-testing.git", from: "0.7.0"),
    ],
    targets: [
        .target(
            name: "OpenLovableSwiftUI",
            dependencies: [],
            path: "Sources"
        ),
        .testTarget(
            name: "OpenLovableSwiftUITests",
            dependencies: [
                "OpenLovableSwiftUI",
                .product(name: "Testing", package: "swift-testing")
            ],
            path: "Tests"
        ),
    ]
)