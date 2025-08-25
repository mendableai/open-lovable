# 🌟 Open Lovable

> Chat with AI to **instantly build React apps**.  
An open-source example app crafted by the [Firecrawl](https://firecrawl.dev/?ref=open-lovable-github) team.  
For a complete cloud-powered solution, check out **[Lovable.dev ❤️](https://lovable.dev/)**.

<p align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmZtaHFleGRsMTNlaWNydGdianI4NGQ4dHhyZjB0d2VkcjRyeXBucCZlcD12MV9faW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/ZFVLWMa6dVskQX0qu1/giphy.gif" alt="Open Lovable Demo" width="80%" />
</p>

<p align="center">
  <a href="https://github.com/mendableai/open-lovable/stargazers">
    <img alt="Stars" src="https://img.shields.io/github/stars/mendableai/open-lovable?style=for-the-badge&color=yellow" />
  </a>
  <a href="https://github.com/mendableai/open-lovable/network/members">
    <img alt="Forks" src="https://img.shields.io/github/forks/mendableai/open-lovable?style=for-the-badge&color=orange" />
  </a>
  <a href="https://github.com/mendableai/open-lovable/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/mendableai/open-lovable?style=for-the-badge&color=red" />
  </a>
  <a href="https://github.com/mendableai/open-lovable/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/mendableai/open-lovable?style=for-the-badge&color=blue" />
  </a>
</p>

---

## 📚 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [Run Locally](#-run-locally)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Contributors](#-contributors)
- [License](#-license)

---

## 🚀 Features
- 🤖 Build React apps via **conversational AI**  
- ⚡ Powered by **Firecrawl** for scraping & AI integrations  
- 🔐 Simple `.env.local` setup for providers  
- 🧩 Bring-your-own-keys: OpenAI, Anthropic, Gemini, Groq (use any one)  
- 🛠️ Developer-friendly: Vite + TypeScript + Tailwind  

---

## 🧰 Tech Stack
- **Frontend:** React + Vite  
- **AI/Infra:** Firecrawl, E2B (Sandboxes)  
- **Lang/Build:** Node.js, npm  
- **Styling/UX:** Tailwind / Chakra / your choice  

---

## ⚡ Quick Start

### 1️⃣ Clone & Install
```bash
git clone https://github.com/mendableai/open-lovable.git
cd open-lovable
npm install
```

### 2️⃣ Environment Setup
Create a `.env.local` file in the project root:
```bash
# Required
E2B_API_KEY=your_e2b_api_key              # https://e2b.dev
FIRECRAWL_API_KEY=your_firecrawl_api_key  # https://firecrawl.dev

# Optional (pick at least ONE AI provider)
ANTHROPIC_API_KEY=your_anthropic_api_key  # https://console.anthropic.com
OPENAI_API_KEY=your_openai_api_key        # https://platform.openai.com
GEMINI_API_KEY=your_gemini_api_key        # https://aistudio.google.com/app/apikey
GROQ_API_KEY=your_groq_api_key            # https://console.groq.com
```

### 3️⃣ Run Locally
```bash
npm run dev
```
👉 Open: [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure
```
open-lovable/
├── public/            # Static assets
├── src/               # Main app source code
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page-level views
│   ├── utils/         # Helper functions
│   └── main.tsx       # App entry point
├── .env.local         # API keys config
├── package.json       # Dependencies & scripts
└── vite.config.ts     # Vite config
```

---

## 🛠️ Scripts
| Command            | Description                        |
|--------------------|------------------------------------|
| `npm install`      | Install dependencies               |
| `npm run dev`      | Start dev server (localhost:3000)  |
| `npm run build`    | Create production build            |
| `npm run preview`  | Preview production build locally   |

---

## ❓ Troubleshooting
- **`code: command not found`** → Install VS Code CLI (`Shell Command: Install 'code' in PATH`).  
- **API errors** → Check if your `.env.local` keys are set correctly.  
- **Port already in use** → Change default port in `vite.config.ts`.  

---

## 🤝 Contributing
Contributions are welcome 💡!  
1. Fork the repo  
2. Create a feature branch  
3. Submit a PR 🎉  

---

## 📦 Deploy to Cloud
Deploy in one click:  
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)  
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)  

---

## 📜 License
MIT © Mendable AI  
✨ Customized & contributed by [**Parth Bhende**](https://github.com/parth11-c) 🚀  
