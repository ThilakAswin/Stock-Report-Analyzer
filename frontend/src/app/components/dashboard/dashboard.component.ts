import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.services';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

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
    MatDividerModule, MatProgressSpinnerModule, BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  selectedFile: File | null = null;
  isUploading: boolean = false;
  dashboardReady: boolean = false; 
  isTyping: boolean = false; 
  currentQuestion: string = '';

  chatHistory: ChatMessage[] = [
    { sender: 'ai', text: 'Dashboard loaded! Ask me any specific questions about your portfolio.' }
  ];

  suggestions = [
    "What is the XIRR of my Silver fund?",
    "How much total profit or loss did I make?",
    "Who is the investor named on this report?"
  ];

  // Dashboard Chart Data
  public barChartData!: ChartData<'bar'>;
  public pieChartData!: ChartData<'pie'>;
  public chartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false };

  constructor(private apiService: ApiService) {}

  onFileSelected(event: any): void {
    if (event.target.files[0]) {
      this.selectedFile = event.target.files[0];
      this.dashboardReady = false;
    }
  }

  onUpload(): void {
    if (!this.selectedFile) return;
    this.isUploading = true;
    
    // Send a secret "INIT_DASHBOARD" question to get the JSON payload for the charts
    this.apiService.analyzeDocument(this.selectedFile, 'INIT_DASHBOARD').subscribe({
      next: (response: any) => {
        try {
          const data = JSON.parse(response.aiAnswer);
          
          // Populate Top Bar Chart
          this.barChartData = {
            labels: ['Total Invested', 'Current Value'],
            datasets: [{ data: data.totals, label: 'Portfolio Value (₹)', backgroundColor: ['#1976d2', '#4caf50'] }]
          };

          // Populate Top Pie Chart
          this.pieChartData = {
            labels: data.labels,
            datasets: [{ data: data.allocation, label: 'Fund Allocation' }]
          };

          this.dashboardReady = true;
          this.isUploading = false;
        } catch (e) {
          console.error("Failed to parse dashboard data");
          this.isUploading = false;
        }
      },
      error: () => this.isUploading = false
    });
  }

  askSuggestion(question: string): void {
    this.currentQuestion = question;
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.currentQuestion.trim() || !this.selectedFile) return;

    const q = this.currentQuestion;
    this.chatHistory.push({ sender: 'user', text: q });
    this.currentQuestion = '';
    this.isTyping = true;

    // Normal text chat request
    this.apiService.analyzeDocument(this.selectedFile, q).subscribe({
      next: (response: any) => {
        this.chatHistory.push({ sender: 'ai', text: response.aiAnswer });
        this.isTyping = false;
      },
      error: () => {
        this.chatHistory.push({ sender: 'ai', text: 'Error connecting to the AI server.' });
        this.isTyping = false;
      }
    });
  }
}