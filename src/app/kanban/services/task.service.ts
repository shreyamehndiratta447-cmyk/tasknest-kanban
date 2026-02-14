export class TaskService {

  getTasks() {
    return Promise.resolve([]);
  }

  createTask(task: any) {
    return Promise.resolve(task);
  }

  updateTask(task: any) {
    return Promise.resolve(task);
  }

  deleteTask(id: number) {
    return Promise.resolve(true);
  }
}
