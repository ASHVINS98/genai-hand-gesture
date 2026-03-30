# AI Hand Gesture to Emoji ✨

An interactive, real-time web application that recognizes your hand gestures using your webcam and translates them into emojis. It also features an AI-powered meaning generator that explains the significance of your gestures using the Groq API!

## Features 🚀

- **Real-Time Gesture Recognition**: Fast and responsive hand tracking for both single and dual hand gestures using your device's camera.
- **Emoji Translation**: Instantly maps recognized hand gestures to their corresponding emojis.
- **AI Meaning Generation**: Utilizes the powerful Groq API to fetch and stream creative and interesting meanings for the gestures you make.
- **Modern UI**: Built with a sleek, responsive design using Tailwind CSS, featuring subtle animations, dark themes, and gradient text.

## Tech Stack 🛠️

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI/LLM API**: [Groq](https://groq.com/) for fast, streaming text generation
- **Language**: TypeScript

## Getting Started 🏁

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
You will also need a **Groq API Key**. You can get one by signing up at [Groq Console](https://console.groq.com/).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ASHVINS98/genai-hand-gesture.git
   cd genai-hand-gesture
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up the Environment Variables:**
   - Copy the `.env.local.example` file to create a new `.env.local` file:
     ```bash
     cp .env.local.example .env.local
     ```
   - Open `.env.local` and add your Groq API Key:
     ```env
     GROQ_API_KEY=your_groq_api_key_here
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser. Make sure to allow camera permissions when prompted!

## How to Use 📸

- Frame your hand(s) in front of the camera.
- Wait for the app to recognize your hand gesture.
- Check the generated emoji on the right (or bottom on mobile) along with an AI-generated meaning that appears below it!
- Look at the "Gesture reference guide" below the camera for the complete list of supported single and two-hand gestures.

## License 📄

This project is open-source and free to use.

---

Built with ❤️ by [Ashwani](https://github.com/ASHVINS98)
