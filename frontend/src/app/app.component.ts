import { Component } from '@angular/core';
// 1. You MUST import RouterOutlet
import { RouterOutlet } from '@angular/router'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. You MUST include it in this array so the HTML knows what it is
  imports: [RouterOutlet], 
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frontend';
}