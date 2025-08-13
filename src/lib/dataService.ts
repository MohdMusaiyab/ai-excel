import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Client, Worker, Task, EntityType } from '@/types';
import { aiService } from './ai';

export class DataService {
  private expectedFields = {
    clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
    workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
    tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
  };

  async parseFile(file: File, entityType: EntityType): Promise<any[]> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    let rawData: string[][] = [];

    if (extension === 'csv') {
      rawData = await this.parseCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      rawData = await this.parseXLSX(file);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or XLSX files.');
    }

    if (rawData.length === 0) {
      throw new Error('File appears to be empty');
    }

   
    const headers = rawData[0];
    const dataRows = rawData.slice(1);

    
    const headerMapping = await aiService.parseAndMapHeaders(
      headers, 
      this.expectedFields[entityType], 
      entityType
    );

   
    const mappedData = dataRows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        const mappedField = headerMapping[header] || header;
        obj[mappedField] = row[index] || '';
      });

    
      if (entityType === 'clients') {
        obj.PriorityLevel = parseInt(obj.PriorityLevel) || 1;
      } else if (entityType === 'workers') {
        obj.MaxLoadPerPhase = parseInt(obj.MaxLoadPerPhase) || 1;
        obj.QualificationLevel = parseInt(obj.QualificationLevel) || 1;
      } else if (entityType === 'tasks') {
        obj.Duration = parseInt(obj.Duration) || 1;
        obj.MaxConcurrent = parseInt(obj.MaxConcurrent) || 1;
      }

      return obj;
    });

    return mappedData;
  }

  private parseCSV(file: File): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve(results.data as string[][]);
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
        skipEmptyLines: true
      });
    });
  }

  private parseXLSX(file: File): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(jsonData as string[][]);
        } catch (error) {
          reject(new Error(`XLSX parsing error: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  }

  exportToCSV(data: any[], filename: string): void {
    const csv = Papa.unparse(data);
    this.downloadFile(csv, filename, 'text/csv');
  }

  exportRulesToJSON(rules: any[], priorities: any[]): void {
    const config = {
      rules,
      priorities,
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(config, null, 2);
    this.downloadFile(json, 'rules.json', 'application/json');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  generateSampleData(): { clients: Client[], workers: Worker[], tasks: Task[] } {
    const clients: Client[] = [
      {
        ClientID: 'C001',
        ClientName: 'Acme Corp',
        PriorityLevel: 3,
        RequestedTaskIDs: 'T001,T002',
        GroupTag: 'Enterprise',
        AttributesJSON: '{"budget": 100000, "deadline": "2024-12-31"}'
      },
      {
        ClientID: 'C002',
        ClientName: 'TechStart Inc',
        PriorityLevel: 5,
        RequestedTaskIDs: 'T003',
        GroupTag: 'Startup',
        AttributesJSON: '{"budget": 50000, "priority": "high"}'
      }
    ];

    const workers: Worker[] = [
      {
        WorkerID: 'W001',
        WorkerName: 'John Doe',
        Skills: 'JavaScript,React,Node.js',
        AvailableSlots: '[1,2,3]',
        MaxLoadPerPhase: 2,
        WorkerGroup: 'Frontend',
        QualificationLevel: 3
      },
      {
        WorkerID: 'W002',
        WorkerName: 'Jane Smith',
        Skills: 'Python,Django,PostgreSQL',
        AvailableSlots: '[2,3,4]',
        MaxLoadPerPhase: 3,
        WorkerGroup: 'Backend',
        QualificationLevel: 4
      },
      {
        WorkerID: 'W003',
        WorkerName: 'Bob Johnson',
        Skills: 'Java,Spring,MySQL',
        AvailableSlots: '[1,3,5]',
        MaxLoadPerPhase: 2,
        WorkerGroup: 'Backend',
        QualificationLevel: 3
      }
    ];

    const tasks: Task[] = [
      {
        TaskID: 'T001',
        TaskName: 'Frontend Development',
        Category: 'Development',
        Duration: 2,
        RequiredSkills: 'JavaScript,React',
        PreferredPhases: '[1,2]',
        MaxConcurrent: 2
      },
      {
        TaskID: 'T002',
        TaskName: 'Backend API',
        Category: 'Development',
        Duration: 3,
        RequiredSkills: 'Python,Django',
        PreferredPhases: '2-4',
        MaxConcurrent: 1
      },
      {
        TaskID: 'T003',
        TaskName: 'Database Design',
        Category: 'Architecture',
        Duration: 1,
        RequiredSkills: 'MySQL,PostgreSQL',
        PreferredPhases: '[1]',
        MaxConcurrent: 1
      }
    ];

    return { clients, workers, tasks };
  }
}

export const dataService = new DataService();