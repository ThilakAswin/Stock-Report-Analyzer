// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class AnalysisService {
//   private apiUrl = 'http://localhost:3000/api/analyze-fund'; // Your backend URL

//   constructor(private http: HttpClient) { }

//   analyzeFund(file: File): Observable<{ message: string, aiAnswer: string }> {
//     const formData = new FormData();
//     formData.append('document', file, file.name);

//     return this.http.post<{ message: string, aiAnswer: string }>(this.apiUrl, formData);
//   }
// }