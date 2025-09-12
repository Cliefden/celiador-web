# AI Chat Assistant

A modern, beautiful AI chat application built with Next.js 14, TypeScript, and Tailwind CSS. This template showcases a sophisticated chat interface with real-time messaging, typing indicators, and premium UI components.

![AI Chat Assistant](https://via.placeholder.com/800x450/667eea/ffffff?text=AI+Chat+Assistant)

## ✨ Features

- **Modern Chat Interface** - Beautiful gradient design with message bubbles
- **Real-time Messaging** - Smooth animations and typing indicators
- **Responsive Design** - Works perfectly on all devices
- **Interactive Elements** - Message reactions, copy functionality, quick suggestions
- **Typing Indicators** - Animated dots showing AI thinking
- **Auto-scrolling** - Automatically scrolls to new messages
- **Character Counter** - Input validation and limits
- **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables (optional):**
   ```bash
   cp .env.example .env.local
   # Add your OpenAI API key to .env.local
   # OPENAI_API_KEY=your_key_here
   ```
   
   **Note:** If no API key is provided, the app will use simulated AI responses for demonstration purposes.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🛠 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **clsx** - Conditional class names

## 📱 UI Components

- **Chat Header** - Brand identity with gradient logos
- **Message Bubbles** - Distinct styling for user vs AI messages
- **Typing Animation** - Bouncing dots indicator
- **Input Field** - Auto-resizing textarea with character count
- **Quick Suggestions** - Pre-filled conversation starters
- **Message Actions** - Copy, thumbs up/down reactions

## 🎨 Design Features

- **Gradient Backgrounds** - Modern blue to purple gradients
- **Backdrop Blur** - Glass morphism effects
- **Smooth Animations** - Transitions and hover effects
- **Shadow System** - Layered shadows for depth
- **Rounded Corners** - Consistent border radius system

## 🔧 Customization

### Colors
Update the gradient colors in `tailwind.config.js` or directly in components:
```jsx
// Primary gradient
bg-gradient-to-r from-blue-600 to-purple-600

// Success gradient  
bg-gradient-to-br from-emerald-500 to-teal-600
```

### AI Integration
The app supports both real OpenAI API integration and simulated responses:

**Real AI (with API key):**
```bash
# Set in .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

**Demo Mode (no API key):**
The app automatically falls back to simulated responses when no API key is provided.

**API Configuration:**
- Model: `gpt-3.5-turbo` (configurable)
- Max tokens: 500
- Temperature: 0.7
- Includes conversation history for context

### Styling
All styles use Tailwind CSS utility classes. Key design tokens:
- **Spacing**: 6-unit system (1.5rem base)
- **Shadows**: Multi-layer shadow system
- **Typography**: Geist font family
- **Colors**: Blue/purple primary, emerald/teal accent

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18", 
    "next": "15.1.3",
    "openai": "^4.0.0",
    "lucide-react": "latest",
    "clsx": "latest"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3.4.1",
    "eslint": "^8",
    "eslint-config-next": "15.1.3"
  }
}
```

## 🎯 Use Cases

Perfect template for:
- AI chat applications
- Customer support bots
- Virtual assistants
- Conversational interfaces
- Educational chat tools
- Therapy/coaching apps

## 📄 License

This template is part of the Celiador platform and is available for use in your projects.

---

**Built with ❤️ using Celiador** - The AI-powered development platform