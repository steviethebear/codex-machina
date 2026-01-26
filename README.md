# Codex Machina

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8)

**Codex Machina** is a collaborative Academic RPG and knowledge management system designed to gamify the learning and note-taking experience. It combines Zettelkasten-style knowledge management with role-playing elements like XP, levels, and achievements to drive student engagement.

## 🚀 Features

- **🎓 Academic RPG**: Earn XP and unlock achievements for contributing notes, making connections, and engaging with course material.
- **🧠 Knowledge Graph**: Visual Zettelkasten-style graph of connected thoughts and notes.
- **🤖 AI-Enhanced**: Integrated with Google Gemini for content evaluation, connections, and feedback.
- **🛡️ Admin Dashboard**: Comprehensive tools for instructors to manage students, content, and moderation.
- **⚡ Real-time Collaboration**: Built on Supabase for real-time data sync and multiplayer features.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **AI**: Google Generative AI (Gemini)

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- Google AI API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/stephenhebert/codex-machina.git
    cd codex-machina
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Copy the example environment file:
    ```bash
    cp .env.local.example .env.local
    ```
    Fill in your keys in `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Stephen Hebert
