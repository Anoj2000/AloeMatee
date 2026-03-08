import http from '../http';

export interface CarePlan {
  id: string;
  title: string;
  description: string;
  tasks: CarePlanTask[];
}

export interface CarePlanTask {
  id: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
  category: string;
}

export async function getCarePlan(): Promise<CarePlan> {
  const response = await http.get<CarePlan>('/careplan');
  return response.data;
}

export async function updateTaskStatus(taskId: string, completed: boolean): Promise<void> {
  await http.patch(`/careplan/tasks/${encodeURIComponent(taskId)}`, { completed });
}

export async function sendChatMessage(message: string): Promise<string> {
  const response = await http.post<{ reply: string }>('/chatbot/message', { message });
  return response.data.reply;
}
