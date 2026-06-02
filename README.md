# 📈 NIFTY50GPT

### AI-Powered Indian Stock Market Research Assistant

NIFTY50GPT is an AI-native stock market analysis assistant built for Indian investors. It allows users to ask natural language questions about NIFTY 50 companies, sectors, market trends, investing concepts, and risk factors, then receive clear, beginner-friendly explanations powered by Google's Gemini AI.

The platform focuses on education, research, and informed decision-making rather than trading signals or speculative recommendations.

---

## 🚀 Features

### 🤖 AI Market Analyst

Ask questions such as:

* "What does Infosys do?"
* "Compare HDFC Bank and ICICI Bank."
* "What are the risks of investing in Reliance?"
* "Explain the IT sector in India."
* "What is a PE ratio?"
* "How does SIP investing work?"

### 🇮🇳 Indian Market Focus

Designed specifically for Indian investors with support for:

* NIFTY 50 companies
* Sector analysis
* Fundamental investing concepts
* Risk awareness
* Long-term investing education

### 🧠 Gemini AI Integration

Powered by Google's Gemini API to generate:

* Plain-English explanations
* Investment research summaries
* Company overviews
* Risk assessments
* Beginner-friendly learning content

### ⚠️ Honest & Transparent

The application does **not** pretend to have live market data.

If real-time market feeds are not connected, the AI clearly states that responses are based on:

* General market knowledge
* Publicly known information
* Educational reasoning

### 📱 Clean Chat Interface

* Simple conversational experience
* Responsive design
* Beginner-friendly layout
* Dark mode support
* Fast AI responses

---

## 🏗 Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* React

### Backend

* Next.js API Routes
* Gemini API

### AI

* Google Gemini 2.5 Flash

---

## 📂 Project Structure

```bash
NIFTY50GPT/
│
├── app/
│   ├── page.tsx
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│
├── components/
│   ├── ChatBox.tsx
│   ├── MessageBubble.tsx
│   └── Header.tsx
│
├── lib/
│   └── gemini.ts
│
├── public/
│
├── styles/
│
├── .env.local
├── package.json
├── next.config.js
└── README.md
```

---

## ⚙️ Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/barnikbasu/NIFTY50GPT.git

cd NIFTY50GPT
```

---

### 2. Install Dependencies

```bash
npm install
```

or

```bash
pnpm install
```

---

### 3. Create Environment File

Create:

```bash
.env.local
```

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 4. Get Gemini API Key

Visit:

https://aistudio.google.com/

Create an API key and paste it into your `.env.local` file.

---

### 5. Run Development Server

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

---

## 🔌 Gemini Configuration

Example initialization:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});
```

---

## 🧠 System Prompt

The AI is instructed to:

* Focus on Indian stock markets
* Explain concepts clearly
* Avoid fake certainty
* Distinguish facts from assumptions
* Encourage diversification
* Discuss risks
* Never guarantee profits
* Remind users that responses are educational

Example instruction:

```text
You are NIFTY50GPT, an AI assistant focused on Indian stock market education and research.

If live market data is unavailable, clearly state that your response is based on general market knowledge.

Do not provide guaranteed returns, price targets, or certainty.

Always explain risks.

End responses with:

"Educational only. Not financial advice."
```

---

## 🔒 Security

* Environment variables for API keys
* Server-side Gemini calls
* No API key exposure to frontend
* Input validation
* Error handling

---

## 📚 Example Questions

### Company Research

```text
Analyze Infosys.
```

```text
What are the strengths of TCS?
```

### Sector Analysis

```text
Explain the Indian banking sector.
```

```text
Which sectors benefit from falling interest rates?
```

### Investing Education

```text
What is a PE ratio?
```

```text
What is the difference between large cap and mid cap stocks?
```

### Risk Analysis

```text
What risks should I consider before buying Reliance?
```

```text
How diversified should a beginner portfolio be?
```

---

## 🚧 Current Limitations

### Live Market Data

Current version does not include:

* NSE real-time feeds
* BSE real-time feeds
* Live option chain data
* Real-time portfolio tracking

Responses are generated using AI reasoning and educational knowledge.

### Not a Trading Platform

NIFTY50GPT is designed for:

✅ Research

✅ Learning

✅ Market understanding

✅ Investment education

It is not intended for:

❌ High-frequency trading

❌ Automated execution

❌ Guaranteed recommendations

❌ Financial advice

---

## 🔮 Future Roadmap

### Phase 1

* Gemini-powered AI chat
* NIFTY 50 company explanations
* Investing education

### Phase 2

* Financial database
* Company fundamentals
* Historical market data

### Phase 3

* AI-powered stock screener
* Portfolio analysis
* Risk scoring

### Phase 4

* RAG for annual reports
* Earnings call analysis
* News intelligence

### Phase 5

* Technical indicators
* Sector rotation analysis
* Institutional-grade research reports

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a pull request

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Barnik Basu**

GitHub:

https://github.com/barnikbasu

---

## Disclaimer

NIFTY50GPT is an educational research tool.

The information generated by the AI may be incomplete, inaccurate, or outdated. Users should verify all information independently before making investment decisions.

Nothing on this platform constitutes investment, legal, tax, or financial advice.

**Educational only. Not financial advice.**
