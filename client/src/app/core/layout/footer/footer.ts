import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-footer',
  imports: [MatIconModule, MatListModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
