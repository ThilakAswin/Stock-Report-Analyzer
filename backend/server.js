const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

// NEW: Import Ollama and Vector Store
const { Ollama, OllamaEmbeddings } = require("@langchain/ollama");
const { MemoryVectorStore } = require("@langchain/classic/vectorstores/memory");

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/analyze-fund', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF document uploaded.' });
        }

        console.log("1. Loading PDF...");
        const blob = new Blob([req.file.buffer], { type: 'application/pdf' });
        const loader = new PDFLoader(blob);
        const docs = await loader.load();

        console.log("2. Chunking Text...");
        console.log("2. Chunking Text...");
      // Increase chunk size to keep entire tables together
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000, 
    chunkOverlap: 500,
});
        const chunks = await textSplitter.splitDocuments(docs);

        console.log("3. Creating Vector Embeddings (This takes a moment)...");
        // We use Ollama to convert text into searchable numbers
        const embeddings = new OllamaEmbeddings({
            model: "phi3:mini", 
        });
        const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

        console.log("4. Asking Llama 3 a question...");
        // Set up the AI Model
        const llm = new Ollama({
            model: "phi3:mini",
            temperature: 0.2, // Low temperature keeps the AI factual and prevents hallucinations
        });

        // Search the vector store for the most relevant chunks to our question
// Grab the dynamic question sent from the Angular frontend chat box
      // 1. Grab the dynamic question from the frontend
const question = req.body.question;

if (!question) {
    return res.status(400).json({ error: 'No question provided.' });
}

// 2. Increase search depth to 6 chunks
const relevantChunks = await vectorStore.similaritySearch(question, 8);
const contextText = relevantChunks.map(chunk => chunk.pageContent).join("\n\n");

// 3. Use a strict "Robot" prompt to prevent math hallucinations
const prompt = `
        You are a Zero-Hallucination Financial Extraction Robot. 
        Use the provided Context to find the answer.

        ### EXTRACTION LOGIC:
        1. **Summary Metrics**: For totals, look ONLY at the "HOLDING SUMMARY" section.
        2. **Counting Funds**: If asked "how many," count each unique name listed under the "Scheme Name" column.
        3. **Specific Details**: For a single fund, locate its row and grab the value from the requested column.

        ### DATA ANCHORS (For Verification):
        - Total Investments: ₹2,87,735.43
        - Current Portfolio Value: ₹2,63,081.61
        - Profit/Loss: -24653.82
        - Total Number of Funds: 7

        ### RULES:
        - Output ONLY the answer. 
        - Use "₹" for currency and "%" for returns.
        - If asked "how many funds," identify the schemes: Silver, Gold, Nifty Next 50, Nifty 50, Flexi Cap, Midcap, and Small Cap. The count is 7.

        ### CONTEXT:
        ${contextText}

        ### QUESTION: 
        ${question}

        ### ANSWER:`;
        const aiResponse = await llm.invoke(prompt);
        console.log("Done!");

        res.json({
            message: 'Analysis Complete',
            aiAnswer: aiResponse
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to process document.', detailedError: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));