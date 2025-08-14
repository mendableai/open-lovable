# Open Lovable

**Instantly build React apps by chatting with AI.**  
Created by the [Firecrawl](https://firecrawl.dev/?ref=open-lovable-github) team.  
For a complete cloud solution, check out [Lovable.dev ❤️](https://lovable.dev/).

<p align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="Open Lovable Demo" width="100%" />
</p>

---

## 🚀 Features
- **Natural Language to Code** – Describe what you want, get a working React app instantly.
- **Multiple AI Providers** – OpenAI, Anthropic, Gemini, Groq, and more.
- **Integrated Web Scraping** – Powered by Firecrawl for real-time data.
- **Sandboxed Execution** – Safe, isolated environments via E2B.

---

## 🛠 Setup

### 1️⃣ Clone & Install
```bash
git clone https://github.com/mendableai/open-lovable.git
cd open-lovable
npm install
````

### 2️⃣ Configure Environment

Create a `.env.local` file in the root directory:

```env
# Required
E2B_API_KEY=your_e2b_api_key                # https://e2b.dev (Sandboxes)
FIRECRAWL_API_KEY=your_firecrawl_api_key    # https://firecrawl.dev (Web scraping)

# Optional – at least one AI provider required
OPENAI_API_KEY=your_openai_api_key          # https://platform.openai.com (GPT-5)
ANTHROPIC_API_KEY=your_anthropic_api_key    # https://console.anthropic.com
GEMINI_API_KEY=your_gemini_api_key          # https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_api_key              # https://console.groq.com (Fast inference - Kimi K2 recommended)
```

> 💡 You only need **one AI provider** to get started.

### 3️⃣ Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License

MIT – See the [LICENSE](LICENSE) file for details.

