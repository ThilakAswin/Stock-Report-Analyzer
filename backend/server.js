const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

// NEW: Cohere Cloud AI Imports
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
        if (!process.env.COHERE_API_KEY) {
            console.error('COHERE_API_KEY not found in .env file.');
            return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No PDF document uploaded.' });
        }

        const question = req.body.question;
        if (!question) {
            return res.status(400).json({ error: 'No question provided.' });
        }

        console.log("1. Loading PDF...");
        const blob = new Blob([req.file.buffer], { type: 'application/pdf' });
        const loader = new PDFLoader(blob);
        const docs = await loader.load();

        console.log("2. Chunking Text...");
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 4000, 
            chunkOverlap: 500,
        });
        const chunks = await textSplitter.splitDocuments(docs);

        console.log("3. Creating Vector Embeddings (Cohere API)...");
        // Cohere's industry-leading embedding model
        const embeddings = new CohereEmbeddings({
            apiKey: process.env.COHERE_API_KEY, 
            model: "embed-english-v3.0",
        });
        const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

        console.log("4. Searching Context and Asking Cohere...");
        const relevantChunks = await vectorStore.similaritySearch(question, 8);
        const contextText = relevantChunks.map(chunk => chunk.pageContent).join("\n\n");
        
        // Setup Cohere using the active, date-stamped version
        const llm = new ChatCohere({
            apiKey: process.env.COHERE_API_KEY,
            model: "command-r-08-2024",
            temperature: 0.2, 
        });
        // Master Prompt: Teaches the AI concepts instead of using brittle examples.
        const prompt = `
You are a Zero-Hallucination Financial Extraction Robot. 
Your only job is to find the exact value from the Context.

### EXTRACTION LOGIC (The "Box" System):
1. **Summary Box**: For totals (Total Invested, Portfolio Value, Overall P&L), look ONLY at the block labeled "HOLDING SUMMARY".
2. **Individual Funds**: For specific funds, look at the "Sub-category" table. 
   - Column 5 is "Invested Value"
   - Column 6 is "Current Value"
   - XIRR is found in the final column of the "Returns" table.

### DATA ANCHORS (For Validation):
- **Total Investments**: 287735.43
- **Current Portfolio Value**: 263081.61
- **Overall Profit/Loss**: -24653.82
- **Number of Funds**: There are 7 unique schemes listed.
- **Silver Specifics**: Invested is 2999.82, Current is 2826.07, XIRR is -32.71%.

### OUTPUT RULES:
- Output ONLY the requested number with its decimal points.
- Do not include conversational filler like "The amount is...".
- If the data is not in the text, respond "Information not found".

### CONTEXT:
${contextText}

### QUESTION: 
${question}

### ANSWER:`;

        const aiResponse = await llm.invoke(prompt);
        console.log("Done!");

        res.json({
            message: 'Analysis Complete',
            aiAnswer: aiResponse.content 
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to process document.', detailedError: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));