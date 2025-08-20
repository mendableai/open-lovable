# Open Lovable 🚀

**Build Beautiful Websites Instantly with AI Magic**

Open Lovable is an AI-powered website builder that allows you to chat with AI to create stunning React applications in seconds. Clone existing websites, build from scratch, or iterate on your ideas with the power of advanced AI models.

![Open Lovable Demo](https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif)

## ✨ Features

- **🤖 AI-Powered Generation**: Advanced AI models understand your requirements and generate production-ready React code
- **🎨 Modern Design System**: Built with React 19, Tailwind CSS, and beautiful UI components
- **🌐 Live Preview**: See your website come to life instantly with live sandbox previews
- **📱 Fully Responsive**: All generated websites work perfectly on desktop, tablet, and mobile
- **🚀 Instant Deployment**: Generate, preview, and deploy websites in minutes
- **💾 File Management**: Download generated code as ZIP files or view individual components
- **🔄 Real-time Updates**: Chat with AI to iterate and improve your website

## 🎯 What You Can Build

- **Landing Pages**: Modern, responsive landing pages for businesses and startups
- **Portfolios**: Professional portfolio websites showcasing work and skills
- **E-commerce Sites**: Complete online stores with product listings and checkout
- **Blogs**: Clean and elegant blog platforms with content management
- **Business Websites**: Corporate websites with multiple sections and features
- **Personal Sites**: Custom websites for individuals and creators

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/firecrawl/open-lovable.git
cd open-lovable
npm install
```

### 2. Environment Setup
Create a `.env.local` file with your API keys:

```env
# Required
E2B_API_KEY=your_e2b_api_key          # Get from https://e2b.dev (Sandboxes)
FIRECRAWL_API_KEY=your_firecrawl_api_key  # Get from https://firecrawl.dev (Web scraping)

# AI Providers (need at least one)
ANTHROPIC_API_KEY=your_anthropic_api_key  # Get from https://console.anthropic.com
OPENAI_API_KEY=your_openai_api_key        # Get from https://platform.openai.com (GPT-5)
GEMINI_API_KEY=your_gemini_api_key        # Get from https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_api_key            # Get from https://console.groq.com (Fast inference)
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start building!

## 🎨 How It Works

### 1. **Chat with AI**
Describe the website you want to build in natural language:
- "Create a modern landing page for a tech startup"
- "Build a portfolio website for a web developer"
- "Make an e-commerce store for selling digital products"

### 2. **AI Generates Code**
The AI analyzes your request and generates:
- Complete React components
- Tailwind CSS styling
- Responsive layouts
- Interactive features

### 3. **Live Preview**
View your website instantly in a live sandbox environment with real-time updates.

### 4. **Download & Deploy**
Download the generated code as a ZIP file or deploy directly to your preferred platform.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS with custom design system
- **AI Integration**: Multiple AI providers (OpenAI, Anthropic, Google, Groq)
- **Sandbox**: E2B cloud development environments
- **Web Scraping**: Firecrawl for website cloning
- **Deployment**: Cloudflare Pages with Edge runtime

## 🌟 Demo Examples

Try these pre-built examples to see what's possible:

- **Modern Landing Page**: Hero section, features grid, testimonials, contact form
- **Portfolio Website**: About section, project gallery, skills display
- **E-commerce Store**: Product grid, shopping cart, checkout flow
- **Personal Blog**: Article layouts, category system, search functionality

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. **Build for Cloudflare:**
   ```bash
   npm run build:cf
   ```

2. **Deploy to Cloudflare Pages:**
   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
   - Click "Create a project"
   - Connect to GitHub repository: `ai-hub-2/open-lovable`
   - Set build settings:
     - **Build command**: `npm run build:pages`
     - **Build output directory**: `.vercel/output/static`
     - **Node.js version**: `20` (recommended)

3. **Environment Variables** (set in Cloudflare Pages UI):
   ```
   E2B_API_KEY=your_actual_key
   FIRECRAWL_API_KEY=your_actual_key
   OPENAI_API_KEY=your_actual_key
   ANTHROPIC_API_KEY=your_actual_key
   GEMINI_API_KEY=your_actual_key
   GROQ_API_KEY=your_actual_key
   NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev
   ENABLE_APPLY_AI_CODE_STREAM=true
   ENABLE_DETECT_INSTALL=true
   ```

### Alternative: Wrangler CLI

```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run deploy:cf
```

### Local Preview & Testing
```bash
# Test build locally
npm run build:test

# Build and preview
npm run build:cf
npm run preview:cf
```

### Troubleshooting

If you encounter build errors:
1. **Clear cache**: Delete `.next` and `.vercel` folders
2. **Reinstall dependencies**: `rm -rf node_modules && npm install`
3. **Check Node.js version**: Use Node.js 20+ for best compatibility
4. **Verify environment variables**: Ensure all API keys are set correctly

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:cf` - Build for Cloudflare Pages
- `npm run lint` - Run ESLint
- `npm run test:all` - Run all tests

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # Shared components
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── ui/               # UI components (buttons, inputs, etc.)
│   ├── ChatMessage.tsx   # Chat message component
│   ├── CodeEditor.tsx    # Code editor and viewer
│   └── SandboxManager.tsx # Sandbox management
├── lib/                   # Utility functions
└── types/                 # TypeScript type definitions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built by the [Firecrawl](https://firecrawl.dev) team
- Powered by advanced AI models from OpenAI, Anthropic, Google, and Groq
- Sandbox environments provided by [E2B](https://e2b.dev)
- Web scraping powered by [Firecrawl](https://firecrawl.dev)

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/firecrawl/open-lovable/issues)
- **Discord**: Join our community for help and discussions
- **Email**: support@firecrawl.dev

---

**Ready to build something amazing?** 🚀

Start chatting with AI and create your next website in minutes with Open Lovable!