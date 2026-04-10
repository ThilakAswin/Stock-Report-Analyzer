import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    CommonModule, FormsModule, MatCardModule, MatButtonModule, 
    MatIconModule, MatInputModule, MatFormFieldModule, 
    MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  selectedFile: File | null = null;
  isUploading: boolean = false;
  isUploaded: boolean = false; // Added to control suggestion visibility
  isTyping: boolean = false; 
  currentQuestion: string = '';

  suggestions = [
    "What is my total invested amount?",
    "What is my current portfolio value?",
    "How many mutual funds am I investing in?",
    "What is the XIRR of my Silver fund?",
    "What is the current value of the Mid Cap fund?"
  ];

  chatHistory: ChatMessage[] = [
    { sender: 'ai', text: 'Hello! Please upload a mutual fund document, and ask me anything about it.' }
  ];

  constructor(private apiService: ApiService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.isUploaded = false; // Reset if a new file is chosen
      this.chatHistory.push({ 
        sender: 'ai', 
        text: `I see you selected ${file.name}. Click 'Upload & Process' to stage it.` 
      });
    }
  }

  onUpload(): void {
    if (!this.selectedFile) return;
    this.isUploading = true;
    
    setTimeout(() => {
      this.isUploading = false;
      this.isUploaded = true; // Show suggestions now
      this.chatHistory.push({ 
        sender: 'ai', 
        text: 'Document staged successfully! What would you like to know about it?' 
      });
    }, 1500);
  }

  // Handle clicking a suggestion chip
  askSuggestion(question: string): void {
    this.currentQuestion = question;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.currentQuestion.trim() || !this.selectedFile) return;

    const questionAsked = this.currentQuestion;
    this.chatHistory.push({ sender: 'user', text: questionAsked });
    this.currentQuestion = '';
    this.isTyping = true;

    this.apiService.analyzeDocument(this.selectedFile, questionAsked).subscribe({
      next: (response: any) => {
        this.chatHistory.push({ sender: 'ai', text: response.aiAnswer });
        this.isTyping = false;
      },
      error: (error: any) => {
        console.error('API Error:', error);
        this.chatHistory.push({ 
          sender: 'ai', 
          text: 'Error connecting to the AI server. Please check your connection and API keys.' 
        });
        this.isTyping = false;
      }
    });
  }
}