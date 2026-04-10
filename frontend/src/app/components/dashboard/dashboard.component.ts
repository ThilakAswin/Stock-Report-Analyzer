import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 1. IMPORT THE REAL API SERVICE
import { ApiService } from '../../services/api.services';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // UI State
  selectedFile: File | null = null;
  isUploading: boolean = false;
  isTyping: boolean = false; 
  currentQuestion: string = '';

  chatHistory: ChatMessage[] = [
    { sender: 'ai', text: 'Hello! Please upload a mutual fund document, and ask me anything about it.' }
  ];

  // 2. INJECT THE SERVICE INTO THE CONSTRUCTOR
  constructor(private apiService: ApiService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.chatHistory.push({ 
        sender: 'ai', 
        text: `I see you selected ${file.name}. Click 'Upload & Process' to stage it.` 
      });
    }
  }

  // UI Event: Visual Upload Delay (Actual processing happens on send)
  onUpload(): void {
    if (!this.selectedFile) return;
    this.isUploading = true;
    
    setTimeout(() => {
      this.isUploading = false;
      this.chatHistory.push({ 
        sender: 'ai', 
        text: 'Document staged successfully! What would you like to know about it?' 
      });
    }, 1500);
  }

  // 3. THE REAL API CALL
sendMessage(): void {
  if (!this.currentQuestion.trim() || !this.selectedFile) return;

  const questionAsked = this.currentQuestion;
  
  // Update UI immediately
  this.chatHistory.push({ sender: 'user', text: questionAsked });
  this.currentQuestion = '';
  this.isTyping = true;

  // Make the real API call
  this.apiService.analyzeDocument(this.selectedFile, questionAsked).subscribe({
    next: (response: any) => {
      // Access the 'aiAnswer' property returned by your server.js
      this.chatHistory.push({ sender: 'ai', text: response.aiAnswer });
      this.isTyping = false;
    },
    error: (error: any) => {
      console.error('API Error:', error);
      this.chatHistory.push({ 
        sender: 'ai', 
        text: 'Error connecting to the local AI server. Please check if your Node.js and Ollama are running.' 
      });
      this.isTyping = false;
    }
  });
}
}