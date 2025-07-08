export class UIController {
  constructor() {
    this.currentResult = null
  }

  showLoading() {
    const parseBtn = document.getElementById('parseBtn')
    parseBtn.disabled = true
    parseBtn.innerHTML = `
      <div class="loading-spinner mr-2 inline-block"></div>
      Parsing...
    `
  }

  hideLoading() {
    const parseBtn = document.getElementById('parseBtn')
    parseBtn.disabled = false
    parseBtn.innerHTML = `
      <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
      Parse & Analyze
    `
  }

  showResults(result) {
    this.currentResult = result
    this.hideLoading()
    
    // Show results section
    const resultsSection = document.getElementById('resultsSection')
    resultsSection.classList.remove('hidden')
    
    // Show copy buttons
    document.getElementById('copyFormattedBtn').classList.remove('hidden')
    document.getElementById('copyAnalysisBtn').classList.remove('hidden')
    
    // Update format badge
    const detectedFormat = document.getElementById('detectedFormat')
    detectedFormat.textContent = result.format.toUpperCase()
    
    // Update version badge if available
    const detectedVersion = document.getElementById('detectedVersion')
    if (result.version) {
      detectedVersion.textContent = result.version
      detectedVersion.classList.remove('hidden')
    } else {
      detectedVersion.classList.add('hidden')
    }
    
    // Update formatted content
    const formattedContent = document.getElementById('formattedContent')
    formattedContent.textContent = result.formatted
    
    // Ensure proper whitespace handling for formatted content
    formattedContent.style.whiteSpace = 'pre-wrap'
    
    // Update analysis
    this.displayAnalysis(result.analysis)
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' })
  }

  displayAnalysis(analysis) {
    const analysisContent = document.getElementById('analysisContent')
    const analysisCount = document.getElementById('analysisCount')
    
    analysisContent.innerHTML = ''
    let itemCount = 0
    
    // Display based on format
    if (analysis.messageType) {
      this.addAnalysisItem('Message Type', analysis.messageType)
      itemCount++
    }
    
    if (analysis.resourceType) {
      this.addAnalysisItem('Resource Type', analysis.resourceType)
      itemCount++
      
      if (analysis.description) {
        this.addAnalysisItem('Description', analysis.description)
        itemCount++
      }
    }
    
    if (analysis.documentType) {
      this.addAnalysisItem('Document Type', analysis.documentType)
      itemCount++
    }
    
    if (analysis.version) {
      this.addAnalysisItem('Version', analysis.version)
      itemCount++
    }
    
    if (analysis.segmentCount) {
      this.addAnalysisItem('Segment Count', analysis.segmentCount.toString())
      itemCount++
    }
    
    if (analysis.recordCount) {
      this.addAnalysisItem('Record Count', analysis.recordCount.toString())
      itemCount++
    }
    
    if (analysis.elementCount) {
      this.addAnalysisItem('Element Count', analysis.elementCount.toString())
      itemCount++
    }
    
    if (analysis.fieldCount) {
      this.addAnalysisItem('Field Count', analysis.fieldCount.toString())
      itemCount++
    }
    
    if (analysis.type) {
      this.addAnalysisItem('Type', analysis.type)
      itemCount++
    }
    
    if (analysis.size) {
      this.addAnalysisItem('Size', this.formatBytes(analysis.size))
      itemCount++
    }
    
    if (analysis.depth) {
      this.addAnalysisItem('Depth', analysis.depth.toString())
      itemCount++
    }
    
    if (analysis.rootElement) {
      this.addAnalysisItem('Root Element', analysis.rootElement)
      itemCount++
    }
    
    if (analysis.templateId) {
      this.addAnalysisItem('Template ID', analysis.templateId)
      itemCount++
    }
    
    if (analysis.code) {
      this.addAnalysisItem('Code', analysis.code)
      itemCount++
    }
    
    if (analysis.recordTypes && analysis.recordTypes.length > 0) {
      this.addAnalysisItem('Record Types', analysis.recordTypes.join(', '))
      itemCount++
    }
    
    if (analysis.namespaces && analysis.namespaces.length > 0) {
      this.addAnalysisItem('Namespaces', analysis.namespaces.join(', '))
      itemCount++
    }
    
    // Display segments/records/structure
    if (analysis.segments && analysis.segments.length > 0) {
      this.addAnalysisSection('Segments', analysis.segments)
      itemCount += analysis.segments.length
    }
    
    if (analysis.records && analysis.records.length > 0) {
      this.addAnalysisSection('Records', analysis.records)
      itemCount += analysis.records.length
    }
    
    if (analysis.structure && analysis.structure.length > 0) {
      this.addAnalysisSection('Structure', analysis.structure)
      itemCount += analysis.structure.length
    }
    
    // Update count badge
    analysisCount.textContent = `${itemCount} items`
  }

  addAnalysisItem(label, value, isCode = false) {
    const analysisContent = document.getElementById('analysisContent')
    const item = document.createElement('div')
    item.className = 'analysis-item'
    
    item.innerHTML = `
      <div class="analysis-label">${this.escapeHtml(label)}</div>
      <div class="analysis-value ${isCode ? 'font-mono text-xs' : ''}">${this.escapeHtml(value)}</div>
    `
    
    analysisContent.appendChild(item)
  }

  addAnalysisSection(title, items) {
    const analysisContent = document.getElementById('analysisContent')
    
    // Add section header
    const header = document.createElement('div')
    header.className = 'analysis-item border-t-2 border-medical-blue pt-3 mt-3'
    header.innerHTML = `
      <div class="analysis-label text-medical-blue">${this.escapeHtml(title)}</div>
    `
    analysisContent.appendChild(header)
    
    // Add items
    for (const item of items) {
      const itemDiv = document.createElement('div')
      itemDiv.className = 'analysis-item pl-4 border-l-2 border-gray-200'
      
      let content = `<div class="analysis-label">${this.escapeHtml(item.name)}</div>`
      
      if (item.fields && item.fields.length > 0) {
        content += '<div class="analysis-value">'
        for (const field of item.fields) {
          if (field.value) {
            content += `<div class="text-xs mb-1"><span class="font-medium">${this.escapeHtml(field.name)}:</span> ${this.escapeHtml(field.value)}</div>`
          }
        }
        content += '</div>'
      } else if (item.value) {
        content += `<div class="analysis-value">${this.escapeHtml(item.value)}</div>`
      } else if (item.type) {
        content += `<div class="analysis-value">Type: ${this.escapeHtml(item.type)}</div>`
      }
      
      if (item.attributes && item.attributes.length > 0) {
        content += `<div class="analysis-value text-xs text-gray-500">Attributes: ${this.escapeHtml(item.attributes.join(', '))}</div>`
      }
      
      if (item.hasChildren) {
        content += '<div class="analysis-value text-xs text-medical-blue">Has child elements</div>'
      }
      
      if (item.textContent) {
        content += `<div class="analysis-value text-xs font-mono bg-gray-50 p-2 rounded mt-1">${this.escapeHtml(item.textContent)}</div>`
      }
      
      itemDiv.innerHTML = content
      analysisContent.appendChild(itemDiv)
    }
  }

  showError(message) {
    const errorSection = document.getElementById('errorSection')
    const errorContent = document.getElementById('errorContent')
    
    errorContent.textContent = message
    errorSection.classList.remove('hidden')
    
    // Hide results
    this.hideResults()
    this.hideLoading()
    
    // Scroll to error
    errorSection.scrollIntoView({ behavior: 'smooth' })
  }

  hideError() {
    const errorSection = document.getElementById('errorSection')
    errorSection.classList.add('hidden')
  }

  hideResults() {
    const resultsSection = document.getElementById('resultsSection')
    resultsSection.classList.add('hidden')
    
    // Hide copy buttons
    document.getElementById('copyFormattedBtn').classList.add('hidden')
    document.getElementById('copyAnalysisBtn').classList.add('hidden')
  }

  showSuccess(message) {
    // Create temporary success notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 z-50 success-message shadow-lg transform transition-all duration-300 translate-x-full'
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">Success</span>
      </div>
      <div class="mt-1">${this.escapeHtml(message)}</div>
    `
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  escapeHtml(text) {
    if (typeof text !== 'string') {
      text = String(text)
    }
    
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}