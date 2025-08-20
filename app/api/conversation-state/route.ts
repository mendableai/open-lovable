import { NextRequest, NextResponse } from 'next/server';
import type { ConversationState } from '@/types/conversation';

export const runtime = 'edge';

declare global {
  var conversationState: ConversationState | null;
}

// GET: Retrieve current conversation state
export async function GET() {
  try {
    if (!globalThis.conversationState) {
      return NextResponse.json({
        success: true,
        state: null,
        message: 'No active conversation'
      });
    }
    
    return NextResponse.json({
      success: true,
      state: globalThis.conversationState
    });
  } catch (error) {
    console.error('[conversation-state] Error getting state:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// POST: Reset or update conversation state
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'reset':
        globalThis.conversationState = {
          conversationId: `conv-${Date.now()}`,
          startedAt: Date.now(),
          lastUpdated: Date.now(),
          context: {
            messages: [],
            edits: [],
            projectEvolution: { majorChanges: [] },
            userPreferences: {}
          }
        } as ConversationState;
        
        console.log('[conversation-state] Reset conversation state');
        
        return NextResponse.json({
          success: true,
          message: 'Conversation state reset',
          state: globalThis.conversationState
        });
        
      case 'clear-old':
        // Clear old conversation data but keep recent context
        if (!globalThis.conversationState) {
          return NextResponse.json({
            success: false,
            error: 'No active conversation to clear'
          }, { status: 400 });
        }
        
        // Keep only recent data
        globalThis.conversationState.context.messages = globalThis.conversationState.context.messages.slice(-5);
        globalThis.conversationState.context.edits = globalThis.conversationState.context.edits.slice(-3);
        globalThis.conversationState.context.projectEvolution.majorChanges = 
          globalThis.conversationState.context.projectEvolution.majorChanges.slice(-2);
        
        console.log('[conversation-state] Cleared old conversation data');
        
        return NextResponse.json({
          success: true,
          message: 'Old conversation data cleared',
          state: globalThis.conversationState
        });
        
      case 'update':
        if (!globalThis.conversationState) {
          return NextResponse.json({
            success: false,
            error: 'No active conversation to update'
          }, { status: 400 });
        }
        
        // Update specific fields if provided
        if (data) {
          if (data.currentTopic) {
            globalThis.conversationState.context.currentTopic = data.currentTopic;
          }
          if (data.userPreferences) {
            globalThis.conversationState.context.userPreferences = {
              ...globalThis.conversationState.context.userPreferences,
              ...data.userPreferences
            };
          }
          
          globalThis.conversationState.lastUpdated = Date.now();
        }
        
        return NextResponse.json({
          success: true,
          message: 'Conversation state updated',
          state: globalThis.conversationState
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "reset" or "update"'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[conversation-state] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// DELETE: Clear conversation state
export async function DELETE() {
  try {
    globalThis.conversationState = null;
    
    console.log('[conversation-state] Cleared conversation state');
    
    return NextResponse.json({
      success: true,
      message: 'Conversation state cleared'
    });
  } catch (error) {
    console.error('[conversation-state] Error clearing state:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}