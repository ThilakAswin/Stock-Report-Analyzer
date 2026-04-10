const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { ChatCohere, CohereEmbeddings } = require("@langchain/cohere");
const { MemoryVectorStore } = require("@langchain/classic/vectorstores/memory");

require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/analyze-fund', upload.single('document'), async (req, res) => {
    try {
        if (!process.env.COHERE_API_KEY) return res.status(500).json({ error: 'Missing API Key.' });
        if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });
        
        const question = req.body.question;
        if (!question) return res.status(400).json({ error: 'No question provided.' });

        console.log(`Processing Request: ${question === 'INIT_DASHBOARD' ? 'Building Dashboard' : 'Chat Question'}`);

        const blob = new Blob([req.file.buffer], { type: 'application/pdf' });
        const loader = new PDFLoader(blob);
        const docs = await loader.load();

        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 500 });
        const chunks = await textSplitter.splitDocuments(docs);

        const embeddings = new CohereEmbeddings({ apiKey: process.env.COHERE_API_KEY, model: "embed-english-v3.0" });
        const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
        
        // 🚨 FIX 1: Use a real search query to find the tables in the PDF!
        let searchQuery = question;
        if (question === 'INIT_DASHBOARD') {
            searchQuery = "HOLDING SUMMARY Total Investments Current Portfolio Value Sub-category Invested Value Current Value";
        }

        const relevantChunks = await vectorStore.similaritySearch(searchQuery, 8);
        const contextText = relevantChunks.map(chunk => chunk.pageContent).join("\n\n");
        
        const llm = new ChatCohere({ apiKey: process.env.COHERE_API_KEY, model: "command-r-08-2024", temperature: 0.1 });

        let prompt = "";

        if (question === 'INIT_DASHBOARD') {
            // 🚨 FIX 2: Tell the AI to extract EVERY item, and sum up duplicates (like Large Cap)
            prompt = `
You are a strict JSON data extraction AI. Analyze the document context and extract key financial metrics.
CRITICAL RULE: Do NOT leave out any categories. Extract ALL of them.

1. **Totals**: Extract the main aggregate numbers (e.g., Total Invested vs Current Value).
2. **Allocation**: Find the detailed table of individual funds/sub-categories. Extract EVERY SINGLE category found (e.g., Silver, Gold, Large Cap, Flexi Cap, Mid Cap, Small Cap) and its "Current Value". 
   - If a category appears more than once (e.g., two "Large Cap" funds), ADD their values together into one total for that category.

RETURN ONLY THIS EXACT JSON FORMAT. NO MARKDOWN. NO CONVERSATION.
{
  "totals": [150000, 175000],
  "labels": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6", "Item 7"],
  "allocation": [10, 20, 30, 40, 50, 60, 70]
}

Context: ${contextText}`;
        } 
        else {
            prompt = `
You are a Financial AI Assistant. Answer the user's question based ONLY on the context provided.
Do NOT generate JSON. Provide a clear, concise text answer.
Context: ${contextText}
Question: ${question}
Answer:`;
        }

        const aiResponse = await llm.invoke(prompt);
        res.json({ message: 'Success', aiAnswer: aiResponse.content });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to process document.', detailedError: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));