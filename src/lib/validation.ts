import { Client, Worker, Task, ValidationError } from '@/types';

export class ValidationService {
  validateClients(clients: Client[], tasks: Task[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const clientIds = new Set<string>();
    const taskIds = new Set(tasks.map(t => t.TaskID));

    clients.forEach((client, index) => {
      // Check duplicate IDs
      if (clientIds.has(client.ClientID)) {
        errors.push({
          type: 'duplicate_id',
          message: `Duplicate ClientID: ${client.ClientID}`,
          row: index,
          column: 'ClientID',
          entity: 'clients',
          severity: 'error'
        });
      }
      clientIds.add(client.ClientID);

      // Check required fields
      if (!client.ClientID) {
        errors.push({
          type: 'missing_required',
          message: 'ClientID is required',
          row: index,
          column: 'ClientID',
          entity: 'clients',
          severity: 'error'
        });
      }

      if (!client.ClientName) {
        errors.push({
          type: 'missing_required',
          message: 'ClientName is required',
          row: index,
          column: 'ClientName',
          entity: 'clients',
          severity: 'error'
        });
      }

      // Check priority level range
      if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
        errors.push({
          type: 'out_of_range',
          message: 'PriorityLevel must be between 1 and 5',
          row: index,
          column: 'PriorityLevel',
          entity: 'clients',
          severity: 'error'
        });
      }

      // Check requested task IDs exist
      if (client.RequestedTaskIDs) {
        const requestedIds = client.RequestedTaskIDs.split(',').map(id => id.trim());
        requestedIds.forEach(taskId => {
          if (taskId && !taskIds.has(taskId)) {
            errors.push({
              type: 'unknown_reference',
              message: `RequestedTaskID ${taskId} does not exist in tasks`,
              row: index,
              column: 'RequestedTaskIDs',
              entity: 'clients',
              severity: 'error'
            });
          }
        });
      }

      // Validate JSON
      if (client.AttributesJSON) {
        try {
          JSON.parse(client.AttributesJSON);
        } catch {
          errors.push({
            type: 'malformed_json',
            message: 'Invalid JSON in AttributesJSON',
            row: index,
            column: 'AttributesJSON',
            entity: 'clients',
            severity: 'error'
          });
        }
      }
    });

    return errors;
  }

  validateWorkers(workers: Worker[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const workerIds = new Set<string>();

    workers.forEach((worker, index) => {
      // Check duplicate IDs
      if (workerIds.has(worker.WorkerID)) {
        errors.push({
          type: 'duplicate_id',
          message: `Duplicate WorkerID: ${worker.WorkerID}`,
          row: index,
          column: 'WorkerID',
          entity: 'workers',
          severity: 'error'
        });
      }
      workerIds.add(worker.WorkerID);

      // Check required fields
      if (!worker.WorkerID) {
        errors.push({
          type: 'missing_required',
          message: 'WorkerID is required',
          row: index,
          column: 'WorkerID',
          entity: 'workers',
          severity: 'error'
        });
      }

      if (!worker.WorkerName) {
        errors.push({
          type: 'missing_required',
          message: 'WorkerName is required',
          row: index,
          column: 'WorkerName',
          entity: 'workers',
          severity: 'error'
        });
      }

      // Validate available slots
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          if (!Array.isArray(slots)) {
            errors.push({
              type: 'malformed_list',
              message: 'AvailableSlots must be an array',
              row: index,
              column: 'AvailableSlots',
              entity: 'workers',
              severity: 'error'
            });
          } else {
            slots.forEach(slot => {
              if (!Number.isInteger(slot) || slot < 1) {
                errors.push({
                  type: 'out_of_range',
                  message: 'AvailableSlots must contain positive integers',
                  row: index,
                  column: 'AvailableSlots',
                  entity: 'workers',
                  severity: 'error'
                });
              }
            });
          }
        } catch {
          // Try as comma-separated string
          const slotStrings = worker.AvailableSlots.split(',').map(s => s.trim());
          slotStrings.forEach(slotStr => {
            const slot = parseInt(slotStr);
            if (isNaN(slot) || slot < 1) {
              errors.push({
                type: 'malformed_list',
                message: 'AvailableSlots contains invalid numbers',
                row: index,
                column: 'AvailableSlots',
                entity: 'workers',
                severity: 'error'
              });
            }
          });
        }
      }

      // Check max load per phase
      if (worker.MaxLoadPerPhase < 1) {
        errors.push({
          type: 'out_of_range',
          message: 'MaxLoadPerPhase must be at least 1',
          row: index,
          column: 'MaxLoadPerPhase',
          entity: 'workers',
          severity: 'error'
        });
      }
    });

    return errors;
  }

  validateTasks(tasks: Task[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const taskIds = new Set<string>();

    tasks.forEach((task, index) => {
      // Check duplicate IDs
      if (taskIds.has(task.TaskID)) {
        errors.push({
          type: 'duplicate_id',
          message: `Duplicate TaskID: ${task.TaskID}`,
          row: index,
          column: 'TaskID',
          entity: 'tasks',
          severity: 'error'
        });
      }
      taskIds.add(task.TaskID);

      // Check required fields
      if (!task.TaskID) {
        errors.push({
          type: 'missing_required',
          message: 'TaskID is required',
          row: index,
          column: 'TaskID',
          entity: 'tasks',
          severity: 'error'
        });
      }

      if (!task.TaskName) {
        errors.push({
          type: 'missing_required',
          message: 'TaskName is required',
          row: index,
          column: 'TaskName',
          entity: 'tasks',
          severity: 'error'
        });
      }

      // Check duration
      if (task.Duration < 1) {
        errors.push({
          type: 'out_of_range',
          message: 'Duration must be at least 1',
          row: index,
          column: 'Duration',
          entity: 'tasks',
          severity: 'error'
        });
      }

      // Check max concurrent
      if (task.MaxConcurrent < 1) {
        errors.push({
          type: 'out_of_range',
          message: 'MaxConcurrent must be at least 1',
          row: index,
          column: 'MaxConcurrent',
          entity: 'tasks',
          severity: 'error'
        });
      }

      // Validate preferred phases
      if (task.PreferredPhases) {
        try {
          // Try parsing as JSON array first
          const phases = JSON.parse(task.PreferredPhases);
          if (!Array.isArray(phases)) {
            throw new Error('Not an array');
          }
        } catch {
          // Try parsing as range (e.g., "1-3")
          if (task.PreferredPhases.includes('-')) {
            const [start, end] = task.PreferredPhases.split('-').map(s => parseInt(s.trim()));
            if (isNaN(start) || isNaN(end) || start > end) {
              errors.push({
                type: 'malformed_list',
                message: 'PreferredPhases range is invalid',
                row: index,
                column: 'PreferredPhases',
                entity: 'tasks',
                severity: 'error'
              });
            }
          } else {
            // Try as comma-separated
            const phases = task.PreferredPhases.split(',').map(p => parseInt(p.trim()));
            if (phases.some(p => isNaN(p) || p < 1)) {
              errors.push({
                type: 'malformed_list',
                message: 'PreferredPhases contains invalid phase numbers',
                row: index,
                column: 'PreferredPhases',
                entity: 'tasks',
                severity: 'error'
              });
            }
          }
        }
      }
    });

    return errors;
  }

  validateCrossReferences(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Get all skills from workers
    const allWorkerSkills = new Set<string>();
    workers.forEach(worker => {
      if (worker.Skills) {
        worker.Skills.split(',').forEach(skill => {
          allWorkerSkills.add(skill.trim().toLowerCase());
        });
      }
    });

    // Check if all required skills are covered
    tasks.forEach((task, index) => {
      if (task.RequiredSkills) {
        const requiredSkills = task.RequiredSkills.split(',').map(s => s.trim().toLowerCase());
        requiredSkills.forEach(skill => {
          if (skill && !allWorkerSkills.has(skill)) {
            errors.push({
              type: 'skill_coverage',
              message: `No worker has required skill: ${skill}`,
              row: index,
              column: 'RequiredSkills',
              entity: 'tasks',
              severity: 'warning'
            });
          }
        });
      }
    });

    return errors;
  }

  validateAll(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
    return [
      ...this.validateClients(clients, tasks),
      ...this.validateWorkers(workers),
      ...this.validateTasks(tasks),
      ...this.validateCrossReferences(clients, workers, tasks)
    ];
  }
}

export const validationService = new ValidationService();