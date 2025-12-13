# DATS-4: Database AI Suite -  User Guide

DATS-4 Analyzeris a powerful tool that allows you to analyze data across multiple sources simultaneously.  

### Original Release Information
Check out our original release post on LinkedIn for useful information and links:  
[https://link.tigzig.com/rex3](https://link.tigzig.com/rex3)      

---

## Quick Start 1: Using the Sample Button

The fastest way to get started with REX-A Analyzer is through the Sample button feature:

1. **Access Sample Files**: 
   - Click the "Sample" button in the top-right corner
   - Browse through curated sample datasets with detailed information about size, row count, and columns

2. **Select and Analyze**:
   - Choose any sample file that interests you
   - Each sample comes with:
     - File description
     - Size and structure information
     - Pre-crafted analysis prompts

3. **Database Options**:
   - After selecting a file, choose between:
     - **Temporary Database**: Instant analysis environment (Recommended for quick start)
     - **Your Own Database**: Connect to your existing database

4. **Quick Analysis**:
   - Copy the provided analysis prompt (Click "Copy Prompt" button)
   - Navigate to the AI Advanced Analyst tab
   - Paste and customize the prompt for detailed analysis

💡 **Pro Tip**: The sample files are carefully curated to demonstrate different analysis capabilities, from simple statistical analysis to complex data transformations.

## Quick Start 2: Sample Files on Google Drive

Sample files are available on Google Drive for quick testing, including:
- RBI Cards / ATM / POS live data (small but rich datasets)
- Mock customer profile datasets (100K to 10M rows)
- Various file sizes from 10MB to 1.2GB

[Access Sample Files](https://drive.google.com/drive/folders/1QlE8tJDKAX9XaHUCabfflPgRnNiOXigV)

## Interface Guide

### Menu System Overview
The app features a clean dropdown menu system with organized options:

#### Main Menu Options
- **Choose File**: Select CSV / TXT files from your device
- **Upload File to DB**: Direct upload to your connected database
- **Fast Insights**: Quick analysis options (appears after file selection)
  - **Table**: Load files into interactive data tables
  - **Structure**: AI analysis of file structure
    - *Quick Structure*: Automated structure analysis
    - *Custom Structure*: Customizable structure analysis prompts
  - **Analysis**: AI-powered data analysis  
    - *Quick Analysis*: Automated analysis using 100 rows of data
    - *Custom Analysis*: Customizable analysis prompts
- **Create New DB**: Create temporary Postgres database (requires login)
- **Connect to DB**: Connect to your existing warehouse using credentials
- **Export Table**: Export data from your connected warehouse
- **Sample Files**: Quick start with curated sample datasets

#### Additional Controls
- **Model Selector**: Choose AI model and agent for Advanced Analyst
- **Chart Toggle**: Switch between chart and table views

### Tabs Overview
- **AI Data Structure**: AI interpretation of file structure with PDF report (results from Structure analysis)
- **AI Quick Insights**: Quick analysis of uploaded file using 100 rows of data with PDF report (results from Analysis)
- **AI Quants Analyst**: Database-connected agent for natural language to SQL conversion and Python-based analysis
- **AI Advanced Analyst**: Sequential agent with multi-step analysis - reasoning, execution, and error handling
- **Logs**: Processing logs and system messages

## Improved File Workflow

### Enhanced File Selection Experience
After selecting a file through "Menu → Choose File", the app now provides clear guidance with an action modal:

1. **File Selection**: 
   - Choose your CSV/TXT file using the file picker
   - File name appears immediately in the interface for confirmation

2. **Action Selection Modal**:
   - **Upload to Database**: Direct upload to your connected warehouse
   - **Fast Insights Options**:
     - *Table View*: Interactive data table with sorting and filtering
     - *Quick Structure*: Instant AI structure analysis
     - *Custom Structure*: Modify structure analysis prompts 
     - *Quick Analysis*: Automated data insights using 100 rows
     - *Custom Analysis*: Customize analysis prompts for specific insights

3. **Smart Processing**:
   - Visual loading indicators for all operations
   - Results automatically appear in the appropriate tab
   - Structure analysis → AI Data Structure tab
   - Analysis results → AI Quick Insights tab

4. **Custom Prompt Dialogs**:
   - Modify AI prompts before analysis
   - Pre-filled with optimized default prompts
   - Real-time preview and editing capabilities

### Visual Indicators
- **File Status**: Selected filename displayed in the interface
- **Database Status**: Connected database name when active
- **Processing Status**: Loading spinners and progress messages
- **Tab Navigation**: Results automatically switch to relevant tabs

## Detailed Features

### 1. BYOW (Bring Your Own Warehouse)
- Connect to MySQL and PostgreSQL warehouses
- Analyze existing warehouse data
- Simple credential-based connection
- Unlimited table sizes and query processing
- Operations executed on warehouse side
- Supports petabyte-scale data across thousands of tables

### 2. Natural Language-to-SQL Querying

#### Video Guide

1. [Basic Natural Language-to-SQL Guide with Statistical Analysis](https://www.youtube.com/watch?v=HX9dS1PZjfo)  
   Updated guide featuring advanced analyst with reasoning capabilities and model choice of o3-mini/deepseek-r1/gemni-flash-2.

2. [Comprehensive Guide: Advanced Analysis with Sequential Reasoning](https://www.youtube.com/watch?v=hqn3zrdXVSQ)

**Video Timeline:**
- 00:00:00 - Capabilities Overview
- 00:02:08 - DB Connection & Analysis
- 00:06:43 - File Upload & Analysis
- 00:09:21 - Sequential Agent Framework
- 00:15:02 - Performance Considerations
- 00:23:09 - Cost Considerations
- 00:29:49 - Live Error Debugging
- 00:37:37 - Architecture & API Flows
- 00:45:08 - Deployment Guide
- 00:58:19 - App Functionalities
- 01:01:05 - Resources
- 01:01:51 - Conclusion

#### Example Queries
- "Pull up record for Customer ID 12345"
- "Show response rate distribution by Education and Housing"
- "Display response rate by 10-year age buckets"
- "Analyze customer demographics with specific filters"

### 3. Interactive Tables
- Sort, filter, and search functionality
- Row details popup via calculator icon
- Column statistics with distribution metrics
- Comprehensive statistical analysis tools

### 4. File Analysis Features
- **File Support**: TXT/CSV files (pipe or comma-delimited)
- **Guided Workflow**: Post-selection action modal for clear next steps
- **Structure Analysis**: 
  - Quick automated analysis using sample rows
  - Custom analysis with editable AI prompts
  - Results display in dedicated AI Data Structure tab
- **Data Analysis Options**:
  - Quick analysis using 100 rows of data  
  - Custom analysis with personalized prompts
  - Results display in AI Quick Insights tab
- **File Size Capabilities**:
  - Tested up to 600MB (5M rows)
  - App limit: 1.5GB (customizable)
  - Performance varies by file size
  - Interactive features work best with files under 10MB
- **User Experience Enhancements**:
  - Immediate filename display after selection
  - Visual loading indicators during processing
  - Automatic tab switching to results

### 5. Warehouse Integration
- Push data to your warehouse
- AI-powered data analysis
- Automatic schema detection
- Interactive query capabilities

### 6. Advanced Analytics
- Python-based statistical analysis
- Custom data transformations
- Chart generation
- Support for both warehouse and uploaded data

---

For technical setup and installation instructions, please refer to our [README.md](./README.md). 