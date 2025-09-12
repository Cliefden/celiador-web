import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Simple in-memory usage counter (in production, use Redis or database)
let usageCount = 0;
const MAX_FREE_REQUESTS = 10;

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Fallback simulation function
function simulateAIResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  const responses = [
    "That's a great question! Let me think about that...",
    "I understand what you're asking. Here's my perspective on that:",
    "Interesting point! Based on what you've shared, I'd suggest:",
    "Thanks for sharing that with me. Here's what I think:",
    "That's a thoughtful question. Let me provide you with some insights:",
  ];

  const followUps = [
    "Would you like me to elaborate on any part of this?",
    "Is there anything specific about this topic you'd like to explore further?",
    "Does this help with what you were looking for?",
    "What other aspects of this would you like to discuss?",
    "Feel free to ask if you need more clarification on anything!",
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  const randomFollowUp = followUps[Math.floor(Math.random() * followUps.length)];
  
  return `${randomResponse}\n\nRegarding "${lastMessage.substring(0, 50)}${lastMessage.length > 50 ? '...' : ''}", I think this is a fascinating topic that deserves a thoughtful response. ${openai ? 'However, I\'m currently running in demo mode without real AI capabilities.' : 'This is a demo interface showing what a modern AI chat might look like!'}\n\n${randomFollowUp}`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Check usage limit first
    if (usageCount >= MAX_FREE_REQUESTS) {
      return NextResponse.json({
        message: `🚀 **Demo limit reached!** You've used all ${MAX_FREE_REQUESTS} free requests.\n\nTo continue chatting, please:\n1. Add your own OpenAI API key to the \`.env.local\` file\n2. Set \`OPENAI_API_KEY=your_key_here\`\n3. Restart the development server\n\n✨ This demo showcases a modern AI chat interface with real API integration!`,
        isSimulated: true,
        limitReached: true
      });
    }

    // If OpenAI API key is not available, use simulation
    if (!openai) {
      console.log('🎭 Using simulated AI response (no OPENAI_API_KEY found)');
      
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return NextResponse.json({
        message: simulateAIResponse(messages),
        isSimulated: true
      });
    }

    // Increment usage counter
    usageCount++;
    console.log(`🤖 Using OpenAI API for response (${usageCount}/${MAX_FREE_REQUESTS})`);

    // Convert messages to OpenAI format
    const openaiMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Add system message
    const systemMessage = {
      role: 'system' as const,
      content: 'You are a helpful AI assistant. Be friendly, informative, and engaging in your responses. Keep responses concise but comprehensive.'
    };

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, ...openaiMessages],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    const remaining = MAX_FREE_REQUESTS - usageCount;
    const usageMessage = remaining > 0 
      ? `\n\n---\n*Demo: ${remaining} free requests remaining. Add your own OpenAI key to continue after that.*`
      : '\n\n---\n*Demo: This was your last free request. Add your own OpenAI key to continue chatting.*';

    return NextResponse.json({
      message: aiResponse + usageMessage,
      isSimulated: false,
      remaining: remaining
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);

    // Fallback to simulation on any error
    console.log('🎭 Falling back to simulated response due to API error');
    
    // Wait a bit to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let errorMessage = simulateAIResponse(messages);
    
    // Provide helpful message based on error type
    if (error?.code === 'invalid_api_key' || error?.status === 401) {
      errorMessage = `🤖 **Demo Mode Active!** The API key is invalid or expired.\n\nThis is a simulated response to showcase the chat interface. To get real AI responses:\n\n1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)\n2. Add it to your \`.env.local\` file: \`OPENAI_API_KEY=your_key_here\`\n3. Restart the development server\n\n✨ In the meantime, enjoy this simulated conversation!\n\n---\n\n${errorMessage}`;
    }
    
    return NextResponse.json({
      message: errorMessage,
      isSimulated: true,
      error: 'Using demo mode'
    });
  }
}