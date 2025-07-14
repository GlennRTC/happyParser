import './style.css'
import { FormatDetector } from './modules/FormatDetector.js'
import { MessageParser } from './modules/MessageParser.js'
import { UIController } from './modules/UIController.js'
import { SyntheticDataGenerator } from './modules/SyntheticDataGenerator.js'

class HealthcareFormatAnalyzer {
  constructor() {
    this.formatDetector = new FormatDetector()
    this.messageParser = new MessageParser()
    this.uiController = new UIController()
    this.syntheticDataGenerator = new SyntheticDataGenerator()
    
    this.init()
  }

  init() {
    this.renderApp()
    this.bindEvents()
  }

  renderApp() {
    const app = document.getElementById('app')
    app.innerHTML = `
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <h1 class="text-2xl font-bold text-medical-blue">
                  <span class="text-medical-teal">The Healthcare</span> Format Analyzer
                </h1>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <span class="bg-medical-blue text-white text-xs px-2 py-1 rounded-full">v1.0</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Hero Section -->
        <section class="text-center mb-12">
          <h2 class="text-4xl font-bold text-medical-dark mb-4">
            Professional Healthcare Data Parser
          </h2>
          <p class="text-xl text-medical-gray mb-8 max-w-3xl mx-auto">
            Analyze, beautify, and understand ASTM, HL7 v2.x/3.x, FHIR, JSON, and XML healthcare messages 
            with detailed structure analysis, format detection, and synthetic data generation.
          </p>
          <div class="flex justify-center space-x-4">
            <div class="bg-medical-blue text-white px-4 py-2 rounded-lg text-sm">ASTM</div>
            <div class="bg-medical-teal text-white px-4 py-2 rounded-lg text-sm">HL7 v2.x/3.x</div>
            <div class="bg-medical-green text-white px-4 py-2 rounded-lg text-sm">FHIR</div>
            <div class="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">JSON</div>
            <div class="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">XML</div>
          </div>
        </section>

        <!-- Tabbed Interface -->
        <section class="medical-card mb-8">
          <!-- Tab Navigation -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8">
              <button id="parserTab" class="tab-button active" data-tab="parser">
                <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Message Parser
              </button>
              <button id="generatorTab" class="tab-button" data-tab="generator">
                <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Synthetic Data Generator
              </button>
            </nav>
          </div>

          <!-- Parser Tab Content -->
          <div id="parserContent" class="tab-content">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-medical-dark">Message Input</h3>
            <button id="clearBtn" class="btn-danger">
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Clear All
            </button>
            </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label for="formatSelect" class="block text-sm font-medium text-medical-dark mb-2">
                Format Type
              </label>
              <select id="formatSelect" class="select-field">
                <option value="">Select format...</option>
                <option value="hl7v2">HL7 v2.x</option>
                <option value="hl7v3">HL7 v3.x (CDA)</option>
                <option value="fhir">FHIR</option>
                <option value="astm">ASTM</option>
                <option value="json">JSON</option>
                <option value="xml">XML</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-medical-dark mb-2">
                Auto-detect Format
              </label>
              <button id="autoDetectBtn" class="btn-outline w-full">
                <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                Auto-detect Format
              </button>
            </div>
          </div>
          
          <div class="mb-6">
            <label for="messageInput" class="block text-sm font-medium text-medical-dark mb-2">
              Paste your healthcare message here
            </label>
            <textarea 
              id="messageInput" 
              class="textarea-field h-48" 
              placeholder="Paste your ASTM, HL7, FHIR, JSON, or XML message here..."
            ></textarea>
          </div>
          
          <div class="flex space-x-4">
            <button id="parseBtn" class="btn-primary">
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Parse & Analyze
            </button>
            <button id="copyFormattedBtn" class="btn-secondary hidden">
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Copy Formatted
            </button>
            <button id="copyAnalysisBtn" class="btn-secondary hidden">
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Copy Analysis
            </button>
            </div>
          </div>

          <!-- Generator Tab Content -->
          <div id="generatorContent" class="tab-content hidden">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-medical-dark">Synthetic Data Generator</h3>
              <button id="clearGeneratorBtn" class="btn-danger">
                <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Clear All
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label for="syntheticFormatSelect" class="block text-sm font-medium text-medical-dark mb-2">
                  Healthcare Format
                </label>
                <select id="syntheticFormatSelect" class="select-field">
                  <option value="">Select format...</option>
                  <option value="HL7 v2.x">HL7 v2.x Messages</option>
                  <option value="HL7 v3.x (CDA)">HL7 v3.x (CDA) Documents</option>
                  <option value="FHIR R4/R5">FHIR R4/R5 Resources</option>
                  <option value="ASTM">ASTM Records</option>
                </select>
              </div>
              <div>
                <label for="syntheticTypeSelect" class="block text-sm font-medium text-medical-dark mb-2">
                  Message/Resource Type
                </label>
                <select id="syntheticTypeSelect" class="select-field" disabled>
                  <option value="">Select type...</option>
                </select>
              </div>
              <div>
                <label for="numResultsSelect" class="block text-sm font-medium text-medical-dark mb-2">
                  Number of Tests/Results
                </label>
                <select id="numResultsSelect" class="select-field" disabled title="Select a lab/diagnostic message type to enable">
                  <option value="1">1 Test/Result</option>
                  <option value="2">2 Tests/Results</option>
                  <option value="3">3 Tests/Results</option>
                  <option value="5">5 Tests/Results</option>
                  <option value="10">10 Tests/Results</option>
                </select>
              </div>
            </div>
            
            <div class="mb-6">
              <div class="flex space-x-4 mb-4">
                <button id="generateBtn" class="btn-primary" disabled>
                  <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Generate Synthetic Data
                </button>
              </div>
              
              <div id="syntheticOutput" class="hidden">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-medical-dark">
                    Generated Healthcare Data
                  </label>
                  <div class="flex space-x-2">
                    <button id="copyGeneratedBtn" class="btn-secondary text-sm">
                      <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      Copy
                    </button>
                    <button id="useGeneratedBtn" class="btn-primary text-sm">
                      <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                      </svg>
                      Use Data
                    </button>
                  </div>
                </div>
                <textarea id="generatedDataOutput" class="textarea-field h-64 font-mono text-sm" readonly></textarea>
                <p class="text-xs text-medical-gray mt-2">
                  Generated data maintains consistent patient information (PII/PHI) across all segments/resources for realistic cross-referencing.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Error Section -->
        <section id="errorSection" class="hidden mb-8">
          <div class="error-message">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              <span class="font-medium">Error</span>
            </div>
            <div id="errorContent" class="mt-2"></div>
          </div>
        </section>

        <!-- Results Section -->
        <section id="resultsSection" class="hidden">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Formatted Message Card -->
            <div class="medical-card">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-medical-dark">Formatted Message</h3>
                <div class="flex items-center space-x-2">
                  <span id="detectedFormat" class="bg-medical-green text-white px-2 py-1 rounded text-sm"></span>
                  <span id="detectedVersion" class="bg-gray-500 text-white px-2 py-1 rounded text-sm hidden"></span>
                </div>
              </div>
              <div id="formattedContent" class="code-block"></div>
            </div>

            <!-- Analysis Card -->
            <div class="medical-card">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-medical-dark">Structure Analysis</h3>
                <div class="flex items-center space-x-2">
                  <span id="analysisCount" class="bg-medical-blue text-white px-2 py-1 rounded text-sm"></span>
                </div>
              </div>
              <div id="analysisContent" class="space-y-4 max-h-96 overflow-y-auto"></div>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="col-span-1 md:col-span-2">
              <h4 class="text-lg font-semibold text-medical-dark mb-4">Healthcare Format Analyzer</h4>
              <p class="text-medical-gray text-sm mb-4">
                Professional healthcare informatics tool for analyzing, parsing, and generating medical data formats. 
                Features synthetic data generation for testing and development. Built for healthcare professionals, developers, and data analysts.
              </p>
              <div class="flex flex-col space-y-2">
                <span class="text-xs text-medical-gray">© 2024 Healthcare Format Analyzer</span>
                <span class="text-xs text-medical-gray">Developed by Glenn R. Tomassi</span>
                <div class="flex items-center space-x-2">
                  <a href="https://github.com/GlennRTC/happyParse" target="_blank" rel="noopener noreferrer" 
                     class="flex items-center text-xs text-medical-blue hover:text-medical-teal transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub Repository
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="font-semibold text-medical-dark mb-4">Supported Formats</h4>
              <ul class="text-sm text-medical-gray space-y-2">
                <li>• HL7 v2.x (ADT, ORM, ORU, etc.)</li>
                <li>• HL7 v3.x (CDA, CCR)</li>
                <li>• FHIR R4/R5</li>
                <li>• ASTM E1381 & others</li>
                <li>• JSON & XML</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold text-medical-dark mb-4">Features</h4>
              <ul class="text-sm text-medical-gray space-y-2">
                <li>• Auto-format & version detection</li>
                <li>• Message beautification</li>
                <li>• Structure analysis</li>
                <li>• Synthetic data generation</li>
                <li>• Field identification</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    `
  }

  bindEvents() {
    // Get elements
    const parseBtn = document.getElementById('parseBtn')
    const clearBtn = document.getElementById('clearBtn')
    const autoDetectBtn = document.getElementById('autoDetectBtn')
    const copyFormattedBtn = document.getElementById('copyFormattedBtn')
    const copyAnalysisBtn = document.getElementById('copyAnalysisBtn')
    const messageInput = document.getElementById('messageInput')
    const formatSelect = document.getElementById('formatSelect')

    // Tab elements
    const parserTab = document.getElementById('parserTab')
    const generatorTab = document.getElementById('generatorTab')
    
    // Synthetic data elements
    const syntheticFormatSelect = document.getElementById('syntheticFormatSelect')
    const syntheticTypeSelect = document.getElementById('syntheticTypeSelect')
    const numResultsSelect = document.getElementById('numResultsSelect')
    const generateBtn = document.getElementById('generateBtn')
    const copyGeneratedBtn = document.getElementById('copyGeneratedBtn')
    const useGeneratedBtn = document.getElementById('useGeneratedBtn')
    const clearGeneratorBtn = document.getElementById('clearGeneratorBtn')

    // Event listeners - Parser
    parseBtn.addEventListener('click', () => this.handleParse())
    clearBtn.addEventListener('click', () => this.handleClear())
    autoDetectBtn.addEventListener('click', () => this.handleAutoDetect())
    copyFormattedBtn.addEventListener('click', () => this.handleCopyFormatted())
    copyAnalysisBtn.addEventListener('click', () => this.handleCopyAnalysis())
    
    // Event listeners - Tabs
    parserTab.addEventListener('click', () => this.switchTab('parser'))
    generatorTab.addEventListener('click', () => this.switchTab('generator'))
    
    // Event listeners - Synthetic Data Generator
    syntheticFormatSelect.addEventListener('change', () => this.updateSyntheticTypes())
    syntheticTypeSelect.addEventListener('change', () => this.validateSyntheticForm())
    generateBtn.addEventListener('click', () => this.handleGenerateSynthetic())
    copyGeneratedBtn.addEventListener('click', () => this.handleCopyGenerated())
    useGeneratedBtn.addEventListener('click', () => this.handleUseGenerated())
    clearGeneratorBtn.addEventListener('click', () => this.handleClearGenerator())
    
    // Initialize synthetic data types
    this.updateSyntheticTypes()
    
    // Keyboard shortcuts
    messageInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.handleParse()
      }
    })
  }

  handleParse() {
    const messageInput = document.getElementById('messageInput')
    const formatSelect = document.getElementById('formatSelect')
    const message = messageInput.value.trim()
    const selectedFormat = formatSelect.value

    if (!message) {
      this.uiController.showError('Please enter a message to parse')
      return
    }

    if (!selectedFormat) {
      this.uiController.showError('Please select a format or use auto-detect')
      return
    }

    this.uiController.showLoading()
    
    try {
      const result = this.messageParser.parse(message, selectedFormat)
      this.uiController.showResults(result)
      this.uiController.hideError()
    } catch (error) {
      this.uiController.showError(error.message)
    }
  }

  handleClear() {
    document.getElementById('messageInput').value = ''
    document.getElementById('formatSelect').value = ''
    this.uiController.hideResults()
    this.uiController.hideError()
  }

  handleAutoDetect() {
    const messageInput = document.getElementById('messageInput')
    const formatSelect = document.getElementById('formatSelect')
    const message = messageInput.value.trim()

    if (!message) {
      this.uiController.showError('Please enter a message first')
      return
    }

    const detectedFormat = this.formatDetector.detectFormat(message)
    
    if (detectedFormat) {
      formatSelect.value = detectedFormat.format
      this.uiController.showSuccess(`Detected format: ${detectedFormat.format.toUpperCase()}${detectedFormat.version ? ' ' + detectedFormat.version : ''}`)
    } else {
      this.uiController.showError('Could not auto-detect format. Please select manually.')
    }
  }

  handleCopyFormatted() {
    const formattedContent = document.getElementById('formattedContent')
    const text = formattedContent.textContent || formattedContent.innerText
    
    navigator.clipboard.writeText(text).then(() => {
      this.uiController.showSuccess('Formatted message copied to clipboard!')
    }).catch(() => {
      this.uiController.showError('Failed to copy to clipboard')
    })
  }

  handleCopyAnalysis() {
    const analysisContent = document.getElementById('analysisContent')
    const text = analysisContent.textContent || analysisContent.innerText
    
    navigator.clipboard.writeText(text).then(() => {
      this.uiController.showSuccess('Analysis copied to clipboard!')
    }).catch(() => {
      this.uiController.showError('Failed to copy to clipboard')
    })
  }

  // Tab Management
  switchTab(tabName) {
    const parserTab = document.getElementById('parserTab')
    const generatorTab = document.getElementById('generatorTab')
    const parserContent = document.getElementById('parserContent')
    const generatorContent = document.getElementById('generatorContent')

    // Remove active class from all tabs
    parserTab.classList.remove('active')
    generatorTab.classList.remove('active')
    
    // Hide all content
    parserContent.classList.add('hidden')
    generatorContent.classList.add('hidden')

    // Show selected tab and content
    if (tabName === 'parser') {
      parserTab.classList.add('active')
      parserContent.classList.remove('hidden')
    } else if (tabName === 'generator') {
      generatorTab.classList.add('active')
      generatorContent.classList.remove('hidden')
    }
  }

  // Synthetic Data Generator Methods
  updateSyntheticTypes() {
    const formatSelect = document.getElementById('syntheticFormatSelect')
    const typeSelect = document.getElementById('syntheticTypeSelect')
    const generateBtn = document.getElementById('generateBtn')
    
    // Clear existing options
    typeSelect.innerHTML = '<option value="">Select type...</option>'
    typeSelect.disabled = true
    generateBtn.disabled = true

    if (formatSelect.value) {
      const presets = this.syntheticDataGenerator.getPresets()
      const formatTypes = presets[formatSelect.value] || []

      formatTypes.forEach(preset => {
        const option = document.createElement('option')
        option.value = preset.value
        option.textContent = preset.label
        option.title = preset.description
        typeSelect.appendChild(option)
      })

      typeSelect.disabled = false
    }
    
    this.validateSyntheticForm()
  }

  validateSyntheticForm() {
    const formatSelect = document.getElementById('syntheticFormatSelect')
    const typeSelect = document.getElementById('syntheticTypeSelect')
    const generateBtn = document.getElementById('generateBtn')
    const numResultsSelect = document.getElementById('numResultsSelect')
    
    // Generate button validation
    generateBtn.disabled = !(formatSelect.value && typeSelect.value)
    
    // Number of Tests/Results validation
    this.updateNumResultsAvailability(formatSelect.value, typeSelect.value, numResultsSelect)
  }

  updateNumResultsAvailability(format, type, numResultsSelect) {
    // HARDCODED TYPES THAT SUPPORT MULTIPLE RESULTS
    // Add new types here when expanding functionality
    const multipleResultsTypes = {
      'HL7 v2.x': [
        'ORU^R01',  // Lab Results
        'OUL^R21'   // Microbiology Results
        // NOTE: ADT^A01 (Patient Admission) intentionally excluded
      ],
      'HL7 v3.x (CDA)': [
        'LabReport' // Laboratory Report
        // NOTE: CCD, DischargeSummary, ProgressNote intentionally excluded
      ],
      'FHIR R4/R5': [
        'DiagnosticReport', // Can contain multiple test results
        'Observation',      // Multiple observations for different tests
        'ServiceRequest'    // Multiple test orders
        // NOTE: Patient, Encounter intentionally excluded (single entities)
      ],
      'ASTM': [
        'Complete',   // Complete Message
        'Order',      // Order Record (multiple orders)
        'Result'      // Result Record
        // NOTE: Patient Record intentionally excluded
      ]
    }

    const formatTypes = multipleResultsTypes[format] || []
    const supportsMultiple = formatTypes.includes(type)
    
    if (supportsMultiple) {
      numResultsSelect.disabled = false
      numResultsSelect.title = 'Select number of tests/results to generate'
      numResultsSelect.classList.remove('opacity-50')
      numResultsSelect.classList.add('transition-opacity', 'duration-300')
    } else {
      numResultsSelect.disabled = true
      numResultsSelect.title = 'This message type generates a single entity (not applicable for multiple results)'
      numResultsSelect.classList.add('opacity-50', 'transition-opacity', 'duration-300')
      numResultsSelect.value = '1' // Reset to 1 when disabled
    }
  }

  handleGenerateSynthetic() {
    const formatSelect = document.getElementById('syntheticFormatSelect')
    const typeSelect = document.getElementById('syntheticTypeSelect')
    const numResultsSelect = document.getElementById('numResultsSelect')
    const outputSection = document.getElementById('syntheticOutput')
    const outputTextarea = document.getElementById('generatedDataOutput')

    const format = formatSelect.value
    const type = typeSelect.value
    const numResults = parseInt(numResultsSelect.value)

    if (!format || !type) {
      this.uiController.showError('Please select both format and type')
      return
    }

    try {
      let generatedData

      switch (format) {
        case 'HL7 v2.x':
          generatedData = this.syntheticDataGenerator.generateHL7v2Message(type, { numResults })
          break
        case 'HL7 v3.x (CDA)':
          generatedData = this.syntheticDataGenerator.generateHL7v3Document(type, { numResults })
          break
        case 'FHIR R4/R5':
          if (type === 'DiagnosticReport' || type === 'ServiceRequest' || type === 'Observation') {
            generatedData = JSON.stringify(
              this.syntheticDataGenerator.generateFHIRResource(type, { numResults }), 
              null, 
              2
            )
          } else {
            generatedData = JSON.stringify(
              this.syntheticDataGenerator.generateFHIRResource(type), 
              null, 
              2
            )
          }
          break
        case 'ASTM':
          generatedData = this.syntheticDataGenerator.generateASTMMessage(type, { numResults })
          break
        default:
          throw new Error('Unsupported format')
      }

      outputTextarea.value = generatedData
      outputSection.classList.remove('hidden')
      
      this.uiController.showSuccess('Synthetic healthcare data generated successfully!')
      
    } catch (error) {
      this.uiController.showError(`Error generating data: ${error.message}`)
    }
  }

  handleCopyGenerated() {
    const outputTextarea = document.getElementById('generatedDataOutput')
    
    if (!outputTextarea.value) {
      this.uiController.showError('No data to copy')
      return
    }

    navigator.clipboard.writeText(outputTextarea.value).then(() => {
      this.uiController.showSuccess('Generated data copied to clipboard!')
    }).catch(() => {
      this.uiController.showError('Failed to copy to clipboard')
    })
  }

  handleUseGenerated() {
    const outputTextarea = document.getElementById('generatedDataOutput')
    const messageInput = document.getElementById('messageInput')
    const formatSelect = document.getElementById('formatSelect')
    const syntheticFormatSelect = document.getElementById('syntheticFormatSelect')
    
    if (!outputTextarea.value) {
      this.uiController.showError('No data to use')
      return
    }

    // Switch to parser tab
    this.switchTab('parser')
    
    // Copy data to message input
    messageInput.value = outputTextarea.value
    
    // Auto-detect format based on synthetic format selection
    const syntheticFormat = syntheticFormatSelect.value
    if (syntheticFormat === 'HL7 v2.x') {
      formatSelect.value = 'hl7v2'
    } else if (syntheticFormat === 'HL7 v3.x (CDA)') {
      formatSelect.value = 'hl7v3'
    } else if (syntheticFormat === 'FHIR R4/R5') {
      formatSelect.value = 'fhir'
    } else if (syntheticFormat === 'ASTM') {
      formatSelect.value = 'astm'
    }
    
    this.uiController.showSuccess('Generated data loaded into parser. Ready to analyze!')
    
    // Scroll to message input
    messageInput.scrollIntoView({ behavior: 'smooth' })
  }

  handleClearGenerator() {
    // Clear all form fields
    const syntheticFormatSelect = document.getElementById('syntheticFormatSelect')
    const syntheticTypeSelect = document.getElementById('syntheticTypeSelect')
    const numResultsSelect = document.getElementById('numResultsSelect')
    const outputSection = document.getElementById('syntheticOutput')
    const outputTextarea = document.getElementById('generatedDataOutput')
    
    // Reset form to default state
    syntheticFormatSelect.value = ''
    syntheticTypeSelect.innerHTML = '<option value="">Select type...</option>'
    syntheticTypeSelect.disabled = true
    numResultsSelect.value = '1'
    numResultsSelect.disabled = true
    numResultsSelect.title = 'Select a lab/diagnostic message type to enable'
    numResultsSelect.classList.add('opacity-50')
    
    // Clear generated output
    outputTextarea.value = ''
    outputSection.classList.add('hidden')
    
    // Disable generate button
    const generateBtn = document.getElementById('generateBtn')
    generateBtn.disabled = true
    
    // Generate new patient data for next session
    this.syntheticDataGenerator.newPatient()
    
    this.uiController.showSuccess('Synthetic data generator cleared. New patient session started.')
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HealthcareFormatAnalyzer()
})