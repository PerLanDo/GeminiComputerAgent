# Gemini Computer Use Agent

A web-based simulation of an autonomous **Google Gemini Computer Use Agent** that perceives desktop/browser interfaces via screenshots and generates structured UI actions (clicks, typing, scrolling, and navigation) to automate user tasks.

---

## ✨ Features

- **Visual Screen Analysis**: Uses `@google/genai` multimodal capabilities to inspect interface states and identify interactive elements.
- **Step-by-Step Action Planning**: Generates reasoning traces and coordinate-based UI actions in real time.
- **Interactive Simulation Environment**: Test custom user prompts and inspect the agent's observation-thought-action loop.

---

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your Gemini API key in `.env.local`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Launch the app:
   ```bash
   npm run dev
   ```
