# Udit's AI — "Think Smarter. Create Faster."

**Udit's AI** is a complete, modern, professional AI chatbot web application powered by the official OpenAI API. It provides fast, accurate, and well-structured answers across programming, education, mathematics, science, writing, language translation, creative brainstorming, and document analysis.

---

## 🌟 Key Features

- **Official OpenAI API Integration**: Server-side streaming using the official `openai` SDK with `gpt-4o-mini` and `gpt-4o`.
- **Zero API Key Leakage**: API keys are securely kept and accessed only on the backend (`OPENAI_API_KEY`).
- **Real-Time Streaming**: Smooth Server-Sent Events (SSE) streaming with live cursor animation and instant generation stop control.
- **Multimodal & Document Analysis**: Upload and analyze text files, CSV tables, PDF/DOCX documents, and images (drag-and-drop or file picker).
- **Rich Markdown & Syntax Highlighting**: Clean rendering for headings, lists, tables, blockquotes, and programming code blocks with one-click **Copy Code** and language labels.
- **Persistent Conversation Management**:
  - Auto-generated conversation titles based on context.
  - Sidebar conversation history grouped by date (Today, Yesterday, Previous 7 Days, Older).
  - Search conversation threads in real time.
  - Inline rename and safe deletion of individual chats.
  - JSON Backup Export and Import for portability.
- **Full Customization**:
  - Dark Mode (default) & Light Mode toggle.
  - Configurable response tones: Balanced, Concise, Detailed, Code Specialist, and Creative.
  - Multilingual support including English, Hindi, Hinglish, Spanish, French, and more.
  - Test Key connection diagnostic tool built into the Settings panel.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** / **yarn**
- An **OpenAI API Key** from [platform.openai.com](https://platform.openai.com)

### 2. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repo-url>
cd udits-ai

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and set your official OpenAI API key:
```env
OPENAI_API_KEY="sk-proj-yourActualOpenAIApiKeyHere..."
OPENAI_MODEL="gpt-4o-mini"
```

> **Note**: You can also enter or test your OpenAI API key directly within the app via **Settings > AI Engine & Keys**.

### 4. Run the Development Server
```bash
npm run dev
```

The application will start at `http://localhost:3000`.

---

## 🏗️ Production Build and Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Deployment to Cloud Platforms (Vercel, Render, Cloud Run)
1. Add `OPENAI_API_KEY` to your hosting platform's Environment Variables.
2. Build command: `npm run build`
3. Start command: `npm run start`

---

## 🔒 Security & Best Practices

- `OPENAI_API_KEY` is strictly managed on the server and is never exposed to browser bundles.
- Uploaded file contents are safely extracted, sanitized, and passed as structured messages to the model.
- HTML content is sanitized, preventing XSS injection.

---

## 📄 License
Apache-2.0. Built for Udit's AI.
