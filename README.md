# Open Lovable

Chat with AI to build React apps instantly. An example app made by the [Firecrawl](https://firecrawl.dev/?ref=open-lovable-github) team. For a complete cloud solution, check out [Lovable.dev ❤️](https://lovable.dev/).

<img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="Open Lovable Demo" width="100%"/>



## Setup

1. **Clone & Install**
```bash
git clone https://github.com/mendableai/open-lovable.git
cd open-lovable
npm install
```

2. **Add `.env.local`**
```env
# Required
E2B_API_KEY=your_e2b_api_key  # Get from https://e2b.dev (Sandboxes)
FIRECRAWL_API_KEY=your_firecrawl_api_key  # Get from https://firecrawl.dev (Web scraping)

# Optional (need at least one AI provider)
ANTHROPIC_API_KEY=your_anthropic_api_key  # Get from https://console.anthropic.com
OPENAI_API_KEY=your_openai_api_key  # Get from https://platform.openai.com (GPT-5)
GEMINI_API_KEY=your_gemini_api_key  # Get from https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_api_key  # Get from https://console.groq.com (Fast inference - Kimi K2 recommended)
```

3. **Run**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)  

## License

MIT
## Troubleshooting

### Error: Cannot find module '../lightningcss.win32-x64-msvc.node'

If you see an error like this during build or startup:

```
Error: Cannot find module '../lightningcss.win32-x64-msvc.node'
Require stack:
- .../node_modules/lightningcss/node/index.js
- .../node_modules/@tailwindcss/node/dist/index.js
- .../node_modules/@tailwindcss/postcss/dist/index.js
- .../.next/build/chunks/[turbopack]_runtime.js
- .../.next/postcss.js
```

This means the native LightningCSS binary for Windows is missing or not installed correctly. To fix:

1. Delete your `node_modules` and lock file:
	```powershell
	Remove-Item -Recurse -Force node_modules
	Remove-Item -Force pnpm-lock.yaml
	pnpm install
	```
2. If the error persists, clear the pnpm cache:
	```powershell
	pnpm store prune
	pnpm install
	```
3. Make sure your Node.js version is compatible with your dependencies.

This issue is common when switching platforms or if the install was interrupted.
