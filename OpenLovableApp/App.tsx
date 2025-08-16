import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import CodeApplicationProgress, { CodeApplicationState } from './src/components/CodeApplicationProgress';
import SandboxPreview from './src/components/SandboxPreview';

function HomeScreen() {
  const [applicationState, setApplicationState] = useState<CodeApplicationState>({
    stage: 'analyzing'
  });

  const [sandboxState, setSandboxState] = useState({
    sandboxId: 'demo-sandbox-123',
    port: 3000,
    type: 'vite' as const,
    output: 'npm install completed successfully\nStarting development server...',
    isLoading: false
  });

  const handleStartSandbox = () => {
    setSandboxState(prev => ({ ...prev, isLoading: true }));
    // Simulate loading
    setTimeout(() => {
      setSandboxState(prev => ({ ...prev, isLoading: false }));
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Open-Lovable Android</Text>
          <Text style={styles.subtitle}>AI-Powered Code Generation & Execution</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Code Application Progress</Text>
          <CodeApplicationProgress state={applicationState} />
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setApplicationState({ stage: 'installing' })}
          >
            <Text style={styles.buttonText}>Start Installation</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sandbox Preview</Text>
          <SandboxPreview {...sandboxState} />
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleStartSandbox}
          >
            <Text style={styles.buttonText}>Start Sandbox</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Console Output</Text>
          <SandboxPreview 
            sandboxId="console-demo"
            port={0}
            type="console"
            output="Welcome to Open-Lovable Console!\n\n> npm install react\n✓ Installed react@18.2.0\n> npm start\n✓ Development server started on port 3000\n\nReady for development!"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                title: 'Open-Lovable',
                headerStyle: {
                  backgroundColor: '#1f2937',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
