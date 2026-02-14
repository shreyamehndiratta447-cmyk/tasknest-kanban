import { Component } from '@angular/core';
import { KanbanComponent } from './kanban/kanban';

@Component({
  selector: 'app-root',
  standalone: true,
 imports: [KanbanComponent],
  templateUrl: './app.html'
})
export class App {}

