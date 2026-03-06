import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [MatIconModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
