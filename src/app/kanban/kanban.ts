import {
  Component,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit
} from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

import { Chart } from 'chart.js/auto';

interface Column {
  id: string;
  title: string;
  tasks: any[];
  gradient?: string;
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './kanban.html',
  styleUrls: ['./kanban.css']
})
export class KanbanComponent implements OnInit, AfterViewInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
   getConnectedDropLists(): string[] {
  return this.columns.map(col => col.id);
}
  // ===== PROFILE MENU =====
  showProfileMenu = false;
  toggleProfileMenu(){
    this.showProfileMenu = !this.showProfileMenu;
  }

  // ===== CHART =====
  @ViewChild('progressChart') chartRef!: ElementRef;
  chartInstance: any;

  // ===== STATE =====
  currentBoard = 1;
  isDark = false;

  showAddModal = false;
  showEditModal = false;
  showColumnModal = false;

  toastMessage = '';
  toastType: 'success' | 'error' | '' = '';
  showToast = false;

  newColumnName = '';
  selectedColumn = '';
  editIndex = -1;

  newTask: any = {
    title: '',
    description: '',
    priority: 'LOW',
    date: ''
  };

  currentTask: any = {};
  currentColumn = '';

  // ===== LOGIN =====
  isLoggedIn = false;
  showLoginModal = false;
  showProfileModal = false;

  loginData = {
    name: '',
    email: '',
    password: '',
    phone: ''
  };

  userProfile: any = {};

  // ===== COLUMNS =====
  columns: Column[] = [
    { id: 'todo', title: '📋 To Do', tasks: [] },
    { id: 'inProgress', title: '🚧 In Progress', tasks: [] },
    { id: 'done', title: '✅ Done', tasks: [] }
  ];

  // ===== INIT =====
  ngOnInit(){

    this.loadTasks();

    if (isPlatformBrowser(this.platformId)) {

      const savedTheme = localStorage.getItem('theme');
      if(savedTheme === 'dark'){
        this.isDark = true;
        document.body.classList.add('dark');
      }

      const savedUser = localStorage.getItem('tasknest_user');
      if(savedUser){
        this.userProfile = JSON.parse(savedUser);
        this.isLoggedIn = true;
      }

    }
  }

  ngAfterViewInit(){
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(()=> this.createChart(),200);
    }
  }

  // ===== DRAG CONNECT =====
  getConnectedLists(currentId: string): string[] {
    return this.columns.map(c => c.id);
  }

  // ===== STORAGE =====
  saveTasks(){
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(
        `tasks_${this.currentBoard}`,
        JSON.stringify(this.columns)
      );
    }
  }

  loadTasks(){
    if (!isPlatformBrowser(this.platformId)) return;

    const data = localStorage.getItem(`tasks_${this.currentBoard}`);
    if (!data) return;

    const parsed = JSON.parse(data);

    this.columns.forEach(col=>{
      const saved = parsed.find((c:any)=>c.id === col.id);
      if(saved) col.tasks = saved.tasks || [];
    });

    parsed.forEach((savedCol:any)=>{
      if(!this.columns.find(c=>c.id === savedCol.id)){
        this.columns.push(savedCol);
      }
    });
  }

  // ===== TOAST =====
  showNotification(message:string,type:'success'|'error'='success'){
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(()=> this.showToast=false,3000);
  }

  // ===== TASK =====
  openAddModal(columnId:string){
    this.selectedColumn = columnId;
    this.showAddModal = true;
  }

  saveNewTask(){
    if(!this.newTask.title.trim()){
      this.showNotification('⚠ Please enter task title','error');
      return;
    }

    const column = this.columns.find(c=>c.id === this.selectedColumn);
    if(!column) return;

    column.tasks.push({...this.newTask});

    this.saveTasks();
    this.refreshChart();

    this.newTask = { title:'',description:'',priority:'LOW',date:'' };
    this.showAddModal = false;
  }

  drop(event: CdkDragDrop<any[]>) {

  if (event.previousContainer === event.container) {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
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

  // ===== THEME =====
  toggleTheme(){

  this.isDark = !this.isDark;

  if (isPlatformBrowser(this.platformId)) {
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

}

  // ===== LOGIN =====
  openLogin(){ this.showLoginModal = true; }

  login(){

    if(!this.loginData.name.trim()){
      this.showNotification('Name Required','error'); return;
    }

    if(!this.loginData.email.includes('@')){
      this.showNotification('Invalid Email','error'); return;
    }

    if(this.loginData.password.length < 6){
      this.showNotification('Password must be 6+ chars','error'); return;
    }

    if(this.loginData.phone.length !== 10){
      this.showNotification('Phone must be 10 digits','error'); return;
    }

    this.userProfile = {...this.loginData};

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('tasknest_user',JSON.stringify(this.userProfile));
    }

    this.isLoggedIn = true;
    this.showLoginModal = false;
    this.showNotification('Login Successful 🚀');

    this.loginData = { name:'',email:'',password:'',phone:'' };
  }

  logout(){

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('tasknest_user');
    }

    this.isLoggedIn = false;
    this.userProfile = {};
    this.showNotification('Logged Out');
  }

  openProfile(){
    if(!this.isLoggedIn){ this.openLogin(); return; }
    this.showProfileModal = true;
  }

  // ===== CHART =====
  createChart(){
    if(!this.chartRef) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if(this.chartInstance) this.chartInstance.destroy();

    this.chartInstance = new Chart(ctx,{
      type:'doughnut',
      data:{
        labels:['Completed','Remaining'],
        datasets:[{
          data:[
            this.getDoneTasks(),
            this.getTotalTasks()-this.getDoneTasks()
          ],
          backgroundColor:['#22c55e','#ef4444'],
          borderWidth:0
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        cutout:'70%',
        plugins:{ legend:{display:false}}
      }
    });
  }

  refreshChart(){
    setTimeout(()=> this.createChart(),100);
  }

  getTotalTasks(){
    return this.columns.reduce((t,c)=>t+c.tasks.length,0);
  }

  getDoneTasks(){
    const done = this.columns.find(c=>c.id==='done');
    return done ? done.tasks.length : 0;
  }
// ===== EDIT TASK =====
openEditModal(task: any, columnId: string) {
  const column = this.columns.find(c => c.id === columnId);
  if (!column) return;

  this.editIndex = column.tasks.indexOf(task);
  this.currentTask = { ...task };
  this.currentColumn = columnId;
  this.showEditModal = true;
}

saveEdit() {
  const column = this.columns.find(c => c.id === this.currentColumn);
  if (!column || this.editIndex === -1) return;

  column.tasks[this.editIndex] = { ...this.currentTask };

  this.saveTasks();
  this.refreshChart();

  this.editIndex = -1;
  this.showEditModal = false;
}

// ===== DELETE TASK =====
deleteTask(task: any, columnId: string) {
  const column = this.columns.find(c => c.id === columnId);
  if (!column) return;

  column.tasks = column.tasks.filter(t => t !== task);

  this.saveTasks();
  this.refreshChart();
}

// ===== ADD COLUMN =====
openColumnModal() {
  this.showColumnModal = true;
}

addColumn() {

  if (!this.newColumnName.trim()) return;

  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #14b8a6, #22c55e)',
    'linear-gradient(135deg, #f59e0b, #f97316)'
  ];

  const randomGradient =
    gradients[Math.floor(Math.random() * gradients.length)];

  this.columns.push({
    id: this.newColumnName.toLowerCase().replace(/\s/g, ''),
    title: `✨ ${this.newColumnName}`,
    tasks: [],
    gradient: randomGradient
  });

  this.saveTasks();
  this.newColumnName = '';
  this.showColumnModal = false;
}

// ===== DELETE COLUMN =====
deleteColumn(index: number) {
  if (index < 3) return;

  this.columns.splice(index, 1);
  this.saveTasks();
}

// ===== PROGRESS =====
getProgress(): number {
  const total = this.getTotalTasks();
  const done = this.getDoneTasks();
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
}
