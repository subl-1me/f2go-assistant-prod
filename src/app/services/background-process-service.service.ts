import { Injectable } from '@angular/core';
import BackgroundProcess from '../models/BackgroundProcess';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BackgroundProcessServiceService {
  private processes: BackgroundProcess[];
  private processesSubject = new BehaviorSubject<BackgroundProcess[]>([]);

  public processes$: Observable<BackgroundProcess[]> =
    this.processesSubject.asObservable();

  constructor() {
    this.processes = [];
  }

  /**
   * Inicia un nuevo proceso en segundo plano
   */
  startProcess(name: string, estimatedTime: number, metadata?: any): string {
    const processId = this.generateId();
    const newProcess: BackgroundProcess = {
      id: processId,
      name,
      progress: 0,
      estimatedTime,
      status: 'Pendiente',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.processes = [...this.processes, newProcess];
    this.emitUpdate();

    // Simulamos que el proceso comienza automáticamente después de 500ms
    setTimeout(
      () => this.updateProcess(processId, { status: 'Procesando' }),
      500
    );

    return processId;
  }

  /**
   * Actualiza un proceso existente
   */
  updateProcess(
    processId: string,
    update: {
      progress?: number;
      estimatedTime?: number;
      status?: 'Pendiente' | 'Procesando' | 'Completado' | 'Fallido';
      metadata?: any;
    }
  ): void {
    this.processes = this.processes.map((process) => {
      if (process.id === processId) {
        const updatedProcess = {
          ...process,
          ...update,
          updatedAt: new Date(),
          completedAt:
            update.status === 'Completado' || update.status === 'Fallido'
              ? new Date()
              : process.completedAt,
        };
        return updatedProcess;
      }
      return process;
    });

    this.emitUpdate();
  }

  /**
   * Completa un proceso exitosamente
   */
  completeProcess(processId: string): void {
    this.updateProcess(processId, {
      progress: 100,
      status: 'Completado',
    });
  }

  /**
   * Marca un proceso como fallido
   */
  failProcess(processId: string, error?: any): void {
    this.updateProcess(processId, {
      status: 'Fallido',
    });
  }

  /**
   * Obtiene un proceso por su ID
   */
  getProcess(processId: string): BackgroundProcess | undefined {
    return this.processes.find((p) => p.id === processId);
  }

  /**
   * Obtiene todos los procesos activos (no completados)
   */
  getActiveProcesses(): BackgroundProcess[] {
    return this.processes.filter(
      (p) => p.status !== 'Completado' && p.status !== 'Fallido'
    );
  }

  /**
   * Elimina procesos completados después de cierto tiempo
   */
  private cleanCompletedProcesses(): void {
    const now = new Date();
    const completedProcessLifetime = 5 * 60 * 1000; // 5 minutos para procesos completados

    this.processes = this.processes.filter((process) => {
      if (process.status === 'Completado' || process.status === 'Fallido') {
        return (
          process.completedAt &&
          now.getTime() - process.completedAt.getTime() <
            completedProcessLifetime
        );
      }
      return true;
    });

    this.emitUpdate();
  }

  /**
   * Elimina un proceso manualmente
   */
  removeProcess(processId: string): void {
    this.processes = this.processes.filter((p) => p.id !== processId);
    this.emitUpdate();
  }

  private emitUpdate(): void {
    this.processesSubject.next([...this.processes]);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }
}
