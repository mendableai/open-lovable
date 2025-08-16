# Open Lovable

Chat with AI to build React apps instantly. An example app made by the [Firecrawl](https://firecrawl.dev/?ref=open-lovable-github) team. For a complete cloud solution, check out [Lovable.dev ❤️](https://lovable.dev/).

<img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="Open Lovable Demo" width="100%"/>



## Setup

First, ensure you have [pnpm](https://pnpm.io/installation) installed. If you don't have it, you can install it with npm:
```bash
npm install -g pnpm
```

Then, follow these steps:

1. **Clone & Install**
    ```bash
    git clone https://github.com/mendableai/open-lovable.git
    cd open-lovable
    pnpm install
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
    pnpm run dev
    ```

Open [http://localhost:3000](http://localhost:3000)  

## License

MIT
