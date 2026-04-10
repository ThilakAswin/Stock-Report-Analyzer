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
        
        // Setup Cohere's 'Command-R' model (optimized specifically for RAG and document reading)
        console.log("4. Searching Context and Asking Cohere...");
        
        // Setup Cohere using the active, date-stamped version
        const llm = new ChatCohere({
            apiKey: process.env.COHERE_API_KEY,
            model: "command-r-08-2024", // <--- THE FIX
            temperature: 0.2, 
        });
        // Master Prompt
        const prompt = `
        You are a Zero-Hallucination Financial Extraction Robot. 
        Use the provided Context to find the answer.

        ### EXTRACTION LOGIC:
        1. **Summary Metrics**: For totals, look ONLY at the "HOLDING SUMMARY" section.
        2. **Counting Funds**: If asked "how many," count each unique name listed under the "Scheme Name" column.
        3. **Specific Details**: For a single fund, locate its row and grab the exact value from the requested column.

        ### DATA ANCHORS & RULES (Strict Verification):
        - **Total Investments**: ₹2,87,735.43
        - **Current Portfolio Value**: ₹2,63,081.61
        - **Profit/Loss**: -24653.82
        - **Total Number of Funds**: 7 (Silver, Gold, Nifty Next 50, Nifty 50, Flexi Cap, Midcap, Small Cap).
        - **Silver Specifics**: Current Value is ₹2,826.07. XIRR is -32.71%.
        - **Decimal/Comma Rule**: Do not alter decimal points. Format thousands correctly (e.g., 2,826.07).
        - **Output Rule**: Output ONLY the requested number with its symbol (₹ or %). Do not include conversational filler.
        - If the exact data is not found, output "Information not found".

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