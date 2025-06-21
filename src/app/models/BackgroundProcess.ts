export default interface BackgroundProcess {
  id: string;
  name: string;
  progress: number;
  estimatedTime: number;
  status: string;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
