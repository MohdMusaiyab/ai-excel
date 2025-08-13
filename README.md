# 🚀 Data Alchemist - AI-Enabled Resource Allocation Configurator

> Transform your data management with intelligent AI-powered tools for resource allocation, validation, and business rule configuration.

## 🌐 Live Demo
**[https://ai-excel-weld.vercel.app/](https://ai-excel-weld.vercel.app/)**

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [AI Integration](#ai-integration)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
- [API Configuration](#api-configuration)
- [Deployment](#deployment)

## 🎯 Overview

Data Alchemist is a sophisticated web application designed for resource allocation management with AI-powered intelligence. It provides comprehensive tools for data ingestion, validation, business rule creation, and priority management - all enhanced with Google Gemini AI integration.

### Key Capabilities
- **Intelligent Data Processing**: CSV/XLSX upload with AI-powered header mapping
- **Advanced Validation**: Real-time error detection with AI-suggested corrections
- **Natural Language Interface**: Search and create rules using plain English
- **Visual Configuration**: Interactive UI for priorities and business rules
- **Export Ready**: Clean data export with rule configurations

## ✨ Features

### 📊 Data Management
- **Multi-format Upload**: Support for CSV and XLSX files
- **Smart Header Mapping**: AI automatically maps CSV headers to expected fields
- **Three Entity Types**: Clients, Workers, and Tasks management
- **Real-time Validation**: Comprehensive data validation with error highlighting
- **Inline Editing**: Click-to-edit data cells with validation

### 🤖 AI-Powered Intelligence
- **Natural Language Search**: Query data using plain English
- **Intelligent Rule Creation**: Convert natural language to structured business rules
- **Error Correction Suggestions**: AI-powered fix recommendations
- **Smart Data Processing**: Automatic data type detection and conversion

### ⚙️ Business Rules Engine
- **Visual Rule Builder**: Drag-and-drop interface for rule creation
- **Rule Types**: Co-run tasks, load limits, phase windows, and more
- **Natural Language Input**: "Tasks T001 and T002 must run together"
- **Rule Validation**: Automatic parameter validation

### 📈 Priority & Weight Management
- **Configurable Weights**: Client priority, task duration, worker qualification
- **Preset Configurations**: Maximize fulfillment, fair distribution, minimize workload
- **Visual Distribution**: Real-time charts and progress indicators
- **Auto-normalization**: Balance weights to 100%

### 🔍 Advanced Validation
- **Multi-level Validation**: Field, cross-reference, and business logic validation
- **Error Classification**: Errors vs warnings with appropriate handling
- **AI-suggested Fixes**: One-click error correction
- **Validation Summary**: Comprehensive error reporting

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Turbopack** - Ultra-fast bundler

### AI Integration
- **Google Gemini 2.0 Flash** - Advanced AI language model
- **@google/generative-ai** - Official Google AI SDK

### Data Processing
- **Papa Parse** - CSV parsing and generation
- **XLSX** - Excel file processing
- **JSON Validation** - Schema validation

### Development
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vercel** - Deployment platform

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Google Gemini API key (optional for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MohdMusaiyab/ai-excel.git
   cd ai-excel
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   echo "NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here" > .env
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

## 🤖 AI Integration

### Google Gemini API Setup
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add the key to your environment variables or configure it in the Settings tab

### AI Features
- **Header Mapping**: Automatically maps CSV columns to expected fields
- **Natural Language Search**: "Show me workers with JavaScript skills"
- **Rule Conversion**: "Tasks T001 and T002 should run together"
- **Error Correction**: AI suggests fixes for validation errors

### Fallback Behavior
All AI features have graceful fallbacks:
- Header mapping falls back to exact string matching
- Search falls back to simple text search
- Rule creation falls back to UI-based builder

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── DataGrid.tsx      # Interactive data table
│   ├── ValidationSummary.tsx  # Error display & AI fixes
│   ├── RuleBuilder.tsx   # Business rule creation
│   ├── PriorityManager.tsx    # Weight configuration
│   ├── SearchComponent.tsx    # Natural language search
│   └── ApiKeyManager.tsx      # AI configuration
├── lib/
│   ├── dataService.ts    # File processing & export
│   ├── validation.ts     # Data validation logic
│   └── ai.ts            # Google Gemini integration
├── types/
│   └── index.ts         # TypeScript definitions
└── utils/
    └── index.ts         # Utility functions
```

## 📖 Usage Guide

### 1. Data Upload
- Navigate to the Data Management tab
- Click "Upload File" for Clients, Workers, or Tasks
- Upload CSV or XLSX files
- AI will automatically map headers to expected fields

### 2. Data Validation
- Errors appear highlighted in red (errors) or yellow (warnings)
- Click on validation summary to see all issues
- Use "🤖 AI Fix" for automatic correction suggestions

### 3. Natural Language Search
- Use the search bar to query data
- Examples: "high priority clients", "workers with Python skills"
- Search works across all entity types

### 4. Business Rules
- Go to Business Rules tab
- Use UI builder for structured rule creation
- Or use natural language: "Frontend workers max 2 tasks per phase"

### 5. Priority Configuration
- Visit Prioritization tab
- Adjust weights using sliders or direct input
- Use presets for common scenarios
- Normalize to 100% for optimal results

### 6. Export
- All validation errors must be fixed before export
- Exports include cleaned data files and rule configuration
- Downloads: clients.csv, workers.csv, tasks.csv, rules.json

## 🔧 API Configuration

### Environment Variables
```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Runtime Configuration
- API key can be set in the Settings tab
- Stored in browser localStorage
- Validates key format before saving

### API Key Management
- Keys are validated for proper format (starts with "AIza")
- Graceful degradation when API unavailable
- Clear indicators of AI feature availability

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel

# Or connect your GitHub repository at vercel.com
```

### Other Platforms
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production
- Set `NEXT_PUBLIC_GEMINI_API_KEY` in your deployment platform
- Or configure via the Settings tab after deployment

## 🎨 Key Features Showcase

### Smart Data Processing
- Handles messy CSV headers automatically
- Converts data types intelligently
- Validates business logic in real-time

### AI-Powered Assistance
- Natural language queries work intuitively
- Error correction suggestions are contextual
- Rule creation understands business terminology

### Enterprise Ready
- Comprehensive validation ensures data quality
- Export functionality maintains data integrity
- Rule configuration enables complex business logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Google AI** - Powerful Gemini API
- **Vercel** - Seamless deployment platform
- **Tailwind CSS** - Beautiful utility-first styling

---

**Built with ❤️ by [Mohd Musaiyab](https://github.com/MohdMusaiyab)**

*Transform your data management workflow with AI-powered intelligence.*
