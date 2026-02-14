import { Component, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Chart } from 'chart.js/auto';

type ColumnType = 'todo' | 'inProgress' | 'done';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './kanban.html',
  styleUrls: ['./kanban.css']
})
export class KanbanComponent implements AfterViewInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // ================= VIEW CHILD =================
  @ViewChild('progressChart') chartRef!: ElementRef;
chartInstance: any;
  // ================= THEME =================
  isDark = false;

  // ================= BOARDS =================
  currentBoard = 1;

  // ================= TASKS =================
  todo: any[] = [];
  inProgress: any[] = [];
  done: any[] = [];
validatePhone() {
  // remove non-digits
  this.profile.phone = this.profile.phone.replace(/\D/g, '');

  // limit to 10 digits
  if (this.profile.phone.length > 10) {
    this.profile.phone = this.profile.phone.slice(0, 10);
  }
}

  // ================= MODALS =================
  showAddModal = false;
  showEditModal = false;
  showSettings = false;
  showProfile = false;
  showStats = false;

  // ================= PROFILE =================
  profile: any = {
    name: 'User',
    email: 'user@email.com',
    phone: '0000000000',
    about: 'Task Manager User'
  };
  editProfileMode = false;

  // ================= NEW TASK =================
  selectedColumn: ColumnType = 'todo';
  newTask: any = { title: '', description: '', priority: 'LOW', date: '' };

  // ================= EDIT TASK =================
  currentTask: any = null;
  currentColumn: ColumnType = 'todo';

  // ================= INIT =================
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const theme = localStorage.getItem('theme');
      this.isDark = theme === 'dark';

      const savedProfile = localStorage.getItem('profile');
      if (savedProfile) this.profile = JSON.parse(savedProfile);

      this.loadTasks();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.createChart(), 200);
    }
  }

  // ================= TASK STORAGE =================
  saveTasks() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(`tasks_${this.currentBoard}`, JSON.stringify({
        todo: this.todo,
        inProgress: this.inProgress,
        done: this.done
      }));
    }
  }

  loadTasks() {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem(`tasks_${this.currentBoard}`);
      if (data) {
        const parsed = JSON.parse(data);
        this.todo = parsed.todo || [];
        this.inProgress = parsed.inProgress || [];
        this.done = parsed.done || [];
      }
    }
  }

  // ================= THEME =================
  toggleTheme() {
    this.isDark = !this.isDark;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    }
  }

  // ================= ADD TASK =================
  openAddModal(column: ColumnType) {
    this.selectedColumn = column;
    this.showAddModal = true;
  }

  saveNewTask() {
    if (!this.newTask.title) return;
    this[this.selectedColumn].push({ ...this.newTask });
    this.resetNewTask();
    this.showAddModal = false;
    this.saveTasks();
    this.refreshChart();
  }

  resetNewTask() {
    this.newTask = { title: '', description: '', priority: 'LOW', date: '' };
  }

  // ================= EDIT TASK =================
 editIndex: number = -1;

openEditModal(task: any, column: ColumnType) {
  this.currentColumn = column;
  this.editIndex = this[column].indexOf(task);
  this.currentTask = { ...task };
  this.showEditModal = true;
}

saveEdit() {
  if (this.editIndex > -1) {
    this[this.currentColumn][this.editIndex] = this.currentTask;
  }
  this.showEditModal = false;
  this.saveTasks();
  this.refreshChart();
}


  // ================= DELETE =================
  deleteTask(task: any, column: ColumnType) {
    this[column] = this[column].filter(t => t !== task);
    this.saveTasks();
    this.refreshChart();
  }

  // ================= DRAG DROP =================
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.saveTasks();
    this.refreshChart();
  }

  // ================= PROFILE =================
  saveProfile() {
    if (this.profile.phone.length !== 10) {
    alert('Phone number must be exactly 10 digits');
    return;
  }

  this.editProfileMode = false;
  localStorage.setItem('profile', JSON.stringify(this.profile));
    this.editProfileMode = false;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('profile', JSON.stringify(this.profile));
    }
  }

  // ================= FOOTER =================
  closeFooterModal(type: string) {
    if (type === 'profile') this.showProfile = false;
    if (type === 'settings') this.showSettings = false;
    if (type === 'stats') this.showStats = false;
  }

  clearAll() {
    this.todo = [];
    this.inProgress = [];
    this.done = [];
    this.saveTasks();
    this.refreshChart();
  }

  // ================= PROGRESS =================
  getProgress() {
    const total = this.todo.length + this.inProgress.length + this.done.length;
    return total === 0 ? 0 : Math.round((this.done.length / total) * 100);
  }

  // ================= CHART =================
 createChart() {
  if (!this.chartRef) return;

  const ctx = this.chartRef.nativeElement.getContext('2d');

  if (this.chartInstance) {
    this.chartInstance.destroy();
  }

  this.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [this.done.length, this.todo.length + this.inProgress.length],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: { legend: { display: false } }
    }
  });
}


  refreshChart() {
    setTimeout(() => this.createChart(), 100);
  }
boards = [
  { id: 1, name: 'Personal' },
  { id: 2, name: 'Work' }
];
switchBoard(id: number) {
  this.currentBoard = +id;
  this.loadTasks();
  this.refreshChart();
}
isOverdue(date: string) {
  if (!date) return false;
  return new Date(date) < new Date();
}
closeAddModal() {
  this.showAddModal = false;
  this.resetNewTask();
}

closeEditModal() {
  this.showEditModal = false;
}
goHome() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

openStats() {
  this.showStats = true;
}

openSettings() {
  this.showSettings = true;
}

openProfile() {
  this.showProfile = true;
}

closeModal(type: string) {
  if (type === 'stats') this.showStats = false;
  if (type === 'settings') this.showSettings = false;
  if (type === 'profile') this.showProfile = false;
}
logout() {
  if (isPlatformBrowser(this.platformId)) {
    localStorage.clear();
    location.reload();
  }

}

}
