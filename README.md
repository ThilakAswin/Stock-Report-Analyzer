# 📊 Smart Portfolio Analyzer

A professional **Full-Stack AI Dashboard** that transforms static PDF investment reports into interactive, visual analytics. Built with **Angular**, **Node.js**, **LangChain**, and **Cohere Cloud AI**, this tool allows users to upload portfolio statements and receive instant financial insights through a dynamic dashboard and a real-time AI chat interface.

## 🚀 Live Demo
* **Frontend (Vercel):** [https://stock-analyzer-fsd.vercel.app]([https://stock-analyzer-fsd.vercel.app](https://stock-report-analyzer-delta.vercel.app/))

---

## ✨ Key Features

* **Dynamic Visual Dashboard:** Automatically generates interactive Bar and Pie charts using **Chart.js** to visualize "Invested vs Current Value" and "Asset Allocation" immediately upon upload.
* **AI Chat Assistant:** A "Zero-Hallucination" financial bot that answers specific questions about your portfolio (e.g., "What is the XIRR of my Silver fund?").
* **Intelligent PDF Parsing:** Uses **LangChain** and **Cohere Embeddings** to extract and categorize complex financial data from PDF documents dynamically.
* **Single-Page App Experience:** A modern, locked-viewport dashboard built with **Angular Material** that eliminates page scrolling for a native desktop feel.
* **Context-Aware Retrieval:** Implements **RAG (Retrieval-Augmented Generation)** to ensure the AI only answers based on the uploaded document's facts.

---

## 🛠️ Technical Stack

### **Frontend**
* **Framework:** Angular 19 (Standalone Components)
* **Styling:** Angular Material & SCSS (Custom Flexbox Layout)
* **Charts:** Ng2-Charts & Chart.js
* **Deployment:** Vercel

### **Backend**
* **Runtime:** Node.js & Express
* **AI Orchestration:** LangChain.js
* **LLM:** Cohere Command-R (08-2024 Version)
* **Embeddings:** Cohere `embed-english-v3.0`
* **Deployment:** Render

---

## ⚙️ Installation & Setup

### **1. Clone the repository**
```bash
git clone [https://github.com/your-username/smart-portfolio-analyzer.git](https://github.com/your-username/smart-portfolio-analyzer.git)
cd smart-portfolio-analyzer
```

2. Backend Setup
```Bash
# Navigate to backend directory
cd backend
npm install
Create a .env file in the backend folder:

Plaintext
COHERE_API_KEY=your_cohere_api_key_here
PORT=3000
Start the server:

Bash
node server.js
```
3. Frontend Setup
```Bash
# Navigate to frontend directory
cd ../frontend
npm install --legacy-peer-deps
Start the Angular dev server:

Bash
ng serve
```
🧠 System Architecture
Ingestion: The PDF is uploaded via a Multer-powered Express route.

Vectorization: Text is chunked and converted into high-dimensional vectors using Cohere Embeddings.

Search: For the initial dashboard, the system performs a targeted similaritySearch for portfolio totals and scheme names.

Parsing: The AI generates a structured JSON payload to populate the Chart.js widgets.

Q&A: Subsequent user questions use the same vector context to provide grounded, text-based financial answers.
