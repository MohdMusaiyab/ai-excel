import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client, Worker, Task, Rule, ValidationError } from '@/types';

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKey: string = '';

  constructor() {
    this.initializeWithKey(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
  }

  initializeWithKey(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } else {
      this.genAI = null;
      this.model = null;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.model;
  }

  private throwIfNotConfigured(featureName: string) {
    console.log('Checking AI configuration for:', featureName); // Debug log
    console.log('API Key exists:', !!this.apiKey); // Debug log
    console.log('Model exists:', !!this.model); // Debug log
    
    if (!this.isConfigured()) {
      throw new Error(`AI feature "${featureName}" requires a valid Gemini API key. Please configure your API key in settings.`);
    }
  }

  async parseAndMapHeaders(headers: string[], expectedFields: string[], entityType: string): Promise<{ [key: string]: string }> {
    if (!this.isConfigured()) {
      // Fallback to simple matching when no API key
      const mapping: { [key: string]: string } = {};
      headers.forEach(header => {
        const match = expectedFields.find(field => 
          field.toLowerCase() === header.toLowerCase() ||
          field.toLowerCase().includes(header.toLowerCase()) ||
          header.toLowerCase().includes(field.toLowerCase())
        );
        mapping[header] = match || header;
      });
      return mapping;
    }

    try {
      const prompt = `
        Map the following CSV headers to the expected fields for ${entityType}:
        
        Provided headers: ${JSON.stringify(headers)}
        Expected fields: ${JSON.stringify(expectedFields)}
        
        Return a JSON object mapping each provided header to the best matching expected field.
        If a header doesn't match any expected field, map it to null.
        
        Example: {"Header1": "ExpectedField1", "Header2": "ExpectedField2", "BadHeader": null}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      } catch {
        // Fallback to exact matching
        const mapping: { [key: string]: string } = {};
        headers.forEach(header => {
          const match = expectedFields.find(field => 
            field.toLowerCase() === header.toLowerCase() ||
            field.toLowerCase().includes(header.toLowerCase()) ||
            header.toLowerCase().includes(field.toLowerCase())
          );
          mapping[header] = match || header;
        });
        return mapping;
      }
    } catch (error) {
      console.error('AI mapping failed, using fallback:', error);
      // Fallback mapping
      const mapping: { [key: string]: string } = {};
      headers.forEach(header => {
        mapping[header] = header;
      });
      return mapping;
    }
  }

  async validateData(data: any[], entityType: string): Promise<ValidationError[]> {
    this.throwIfNotConfigured('Data Validation');
    
    try {
      const sampleData = data.slice(0, 5); // Only send sample for validation
      const prompt = `
        Analyze this ${entityType} data and identify validation errors:
        
        Sample data: ${JSON.stringify(sampleData, null, 2)}
        
        Check for:
        - Missing required fields
        - Invalid data types
        - Out of range values
        - Malformed JSON
        - Inconsistent formatting
        
        Return an array of validation errors in this format:
        [{"type": "error_type", "message": "description", "severity": "error|warning"}]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
      } catch {
        return [];
      }
    } catch (error) {
      console.error('AI validation failed:', error);
      return [];
    }
  }

  async searchData(query: string, data: any[], entityType: string): Promise<any[]> {
    if (!this.isConfigured()) {
      // Fallback to simple text search when no API key
      return data.filter(item => 
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      const prompt = `
        Search the ${entityType} data based on this natural language query: "${query}"
        
        Data: ${JSON.stringify(data.slice(0, 10), null, 2)}
        
        Return the indices of matching rows as a JSON array of numbers.
        If no matches, return empty array [].
        
        Examples:
        - "tasks with duration more than 2" -> [1, 3, 5]
        - "workers with java skills" -> [0, 2, 4]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const indices = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        return data.filter((_, index) => indices.includes(index));
      } catch {
        // Fallback search
        return data.filter(item => 
          JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
        );
      }
    } catch (error) {
      console.error('AI search failed, using fallback:', error);
      return data.filter(item => 
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  async convertToRule(naturalLanguage: string, availableData: { clients: Client[], workers: Worker[], tasks: Task[] }): Promise<Rule | null> {
    this.throwIfNotConfigured('Natural Language Rule Conversion');
    
    try {
      const prompt = `
        Convert this natural language rule into a structured rule object:
        "${naturalLanguage}"
        
        Available data context:
        - Clients: ${availableData.clients.slice(0, 3).map(c => c.ClientID).join(', ')}
        - Workers: ${availableData.workers.slice(0, 3).map(w => w.WorkerID).join(', ')}
        - Tasks: ${availableData.tasks.slice(0, 3).map(t => t.TaskID).join(', ')}
        
        Return a rule in this format:
        {
          "id": "rule_1",
          "type": "coRun|slotRestriction|loadLimit|phaseWindow|patternMatch|precedence",
          "name": "Rule Name",
          "parameters": {},
          "description": "Human readable description"
        }
        
        If the rule cannot be converted, return null.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const rule = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        if (rule && rule.type) {
          rule.id = `rule_${Date.now()}`;
          return rule;
        }
        return null;
      } catch {
        return null;
      }
    } catch (error) {
      console.error('AI rule conversion failed:', error);
      return null;
    }
  }

  async suggestCorrections(data: any[], errors: ValidationError[], entityType: string): Promise<{ [key: string]: any }> {
    console.log('suggestCorrections called with:', { dataLength: data.length, errorsLength: errors.length, entityType }); // Debug log
    this.throwIfNotConfigured('AI Correction Suggestions');
    
    try {
      const prompt = `
        Suggest corrections for the following data errors:
        
        Entity Type: ${entityType}
        Sample Data: ${JSON.stringify(data.slice(0, 3), null, 2)}
        Errors: ${JSON.stringify(errors.slice(0, 5), null, 2)}
        
        Return suggestions as a JSON object with row indices as keys and suggested corrections as values:
        {
          "0": {"field": "corrected_value"},
          "1": {"field": "corrected_value"}
        }
      `;

      console.log('Sending prompt to AI:', prompt); // Debug log

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Raw AI response:', text); // Debug log
      
      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        console.log('Parsed AI response:', parsed); // Debug log
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError); // Debug log
        return {};
      }
    } catch (error) {
      console.error('AI correction suggestions failed:', error);
      return {};
    }
  }
}

export const aiService = new AIService();