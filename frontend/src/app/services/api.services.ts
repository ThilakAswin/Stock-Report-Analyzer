import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the response structure so TypeScript doesn't complain
export interface AiResponse {
  message: string;
  aiAnswer: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  // Point this to your Express server
  private apiUrl = 'https://stock-report-analyzer.onrender.com/api/analyze-fund';

  constructor(private http: HttpClient) { }

  // Takes both the PDF file and the user's chat question
  analyzeDocument(file: File, question: string): Observable<AiResponse> {
    const formData = new FormData();
    
    // These keys MUST match what the Node.js backend is looking for
    formData.append('document', file);
    formData.append('question', question); 

    return this.http.post<AiResponse>(this.apiUrl, formData);
  }
}