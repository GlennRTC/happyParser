import './style.css'
import { FormatDetector } from './modules/FormatDetector.js'
import { MessageParser } from './modules/MessageParser.js'
import { UIController } from './modules/UIController.js'

class HealthcareFormatAnalyzer {
  constructor() {
    this.formatDetector = new FormatDetector()
    this.messageParser = new MessageParser()
    this.uiController = new UIController()
    
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
                  <span class="text-medical-teal">Healthcare</span> Format Analyzer
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
            with detailed structure analysis and format detection.
          </p>
          <div class="flex justify-center space-x-4">
            <div class="bg-medical-blue text-white px-4 py-2 rounded-lg text-sm">ASTM</div>
            <div class="bg-medical-teal text-white px-4 py-2 rounded-lg text-sm">HL7 v2.x/3.x</div>
            <div class="bg-medical-green text-white px-4 py-2 rounded-lg text-sm">FHIR</div>
            <div class="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">JSON</div>
            <div class="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">XML</div>
          </div>
        </section>

        <!-- Input Section -->
        <section class="medical-card mb-8">
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
                Professional healthcare informatics tool for analyzing and parsing medical data formats. 
                Built for healthcare professionals, developers, and data analysts.
              </p>
              <div class="flex space-x-4">
                <span class="text-xs text-medical-gray">© 2024 Healthcare Format Analyzer</span>
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
                <li>• Auto-format detection</li>
                <li>• Message beautification</li>
                <li>• Structure analysis</li>
                <li>• Field identification</li>
                <li>• Version detection</li>
                <li>• Copy functionality</li>
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

    // Event listeners
    parseBtn.addEventListener('click', () => this.handleParse())
    clearBtn.addEventListener('click', () => this.handleClear())
    autoDetectBtn.addEventListener('click', () => this.handleAutoDetect())
    copyFormattedBtn.addEventListener('click', () => this.handleCopyFormatted())
    copyAnalysisBtn.addEventListener('click', () => this.handleCopyAnalysis())
    
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HealthcareFormatAnalyzer()
})