export class UIController {
  constructor() {
    this.currentResult = null
    this.itemCount = 0
    this.maxItems = 50
    this.maxDepth = 8
    this.priorityFields = new Set([
      'resourceType', 'id', 'status', 'code', 'name', 'type', 'value', 
      'system', 'display', 'reference', 'url', 'version', 'title'
    ])
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
    this.itemCount = 0
    
    // Display basic metadata first
    this.displayBasicAnalysis(analysis)
    
    // Display hierarchical structure for complex data
    if (analysis.detailedStructure) {
      this.addTreeSection('Detailed Structure', analysis.detailedStructure)
    } else if (analysis.segments && analysis.segments.length > 0) {
      this.addAnalysisSection('Segments', analysis.segments)
    } else if (analysis.records && analysis.records.length > 0) {
      this.addAnalysisSection('Records', analysis.records)
    } else if (analysis.structure && analysis.structure.length > 0) {
      if (this.shouldUseTreeView(analysis.structure)) {
        this.addTreeSection('Structure', analysis.structure)
      } else {
        this.addAnalysisSection('Structure', analysis.structure)
      }
    }
    
    // Update count badge
    analysisCount.textContent = `${this.itemCount} items`
  }

  displayBasicAnalysis(analysis) {
    if (analysis.messageType) {
      this.addAnalysisItem('Message Type', analysis.messageType)
    }
    
    if (analysis.resourceType) {
      this.addAnalysisItem('Resource Type', analysis.resourceType)
      if (analysis.description) {
        this.addAnalysisItem('Description', analysis.description)
      }
    }
    
    if (analysis.documentType) {
      this.addAnalysisItem('Document Type', analysis.documentType)
    }
    
    if (analysis.version) {
      this.addAnalysisItem('Version', analysis.version)
    }
    
    if (analysis.segmentCount) {
      this.addAnalysisItem('Segment Count', analysis.segmentCount.toString())
    }
    
    if (analysis.recordCount) {
      this.addAnalysisItem('Record Count', analysis.recordCount.toString())
    }
    
    if (analysis.elementCount) {
      this.addAnalysisItem('Element Count', analysis.elementCount.toString())
    }
    
    if (analysis.fieldCount) {
      this.addAnalysisItem('Field Count', analysis.fieldCount.toString())
    }
    
    if (analysis.type) {
      this.addAnalysisItem('Type', analysis.type)
    }
    
    if (analysis.size) {
      this.addAnalysisItem('Size', this.formatBytes(analysis.size))
    }
    
    if (analysis.depth) {
      this.addAnalysisItem('Depth', analysis.depth.toString())
    }
    
    if (analysis.rootElement) {
      this.addAnalysisItem('Root Element', analysis.rootElement)
    }
    
    if (analysis.templateId) {
      this.addAnalysisItem('Template ID', analysis.templateId)
    }
    
    if (analysis.code) {
      this.addAnalysisItem('Code', analysis.code)
    }
    
    if (analysis.recordTypes && analysis.recordTypes.length > 0) {
      this.addAnalysisItem('Record Types', analysis.recordTypes.join(', '))
    }
    
    if (analysis.namespaces && analysis.namespaces.length > 0) {
      this.addAnalysisItem('Namespaces', analysis.namespaces.join(', '))
    }
  }

  shouldUseTreeView(structure) {
    // Use tree view for complex nested structures
    return structure.some(item => 
      item.fields && item.fields.length > 3 || 
      item.attributes && item.attributes.length > 2 ||
      item.hasChildren
    )
  }

  addAnalysisItem(label, value, isCode = false) {
    if (this.itemCount >= this.maxItems) return
    
    const analysisContent = document.getElementById('analysisContent')
    const item = document.createElement('div')
    item.className = 'analysis-item'
    
    const labelDiv = document.createElement('div')
    labelDiv.className = 'analysis-label'
    labelDiv.textContent = label
    
    const valueDiv = document.createElement('div')
    valueDiv.className = `analysis-value ${isCode ? 'font-mono text-xs' : ''}`
    valueDiv.textContent = value
    
    item.appendChild(labelDiv)
    item.appendChild(valueDiv)
    
    analysisContent.appendChild(item)
    this.itemCount++
  }

  addTreeSection(title, data) {
    if (this.itemCount >= this.maxItems) return
    
    const analysisContent = document.getElementById('analysisContent')
    
    // Add section header
    const header = document.createElement('div')
    header.className = 'analysis-item border-t-2 border-medical-blue pt-3 mt-3'
    
    const headerLabel = document.createElement('div')
    headerLabel.className = 'analysis-label text-medical-blue'
    headerLabel.textContent = title
    header.appendChild(headerLabel)
    
    analysisContent.appendChild(header)
    
    // Create tree structure
    const treeContainer = document.createElement('div')
    treeContainer.className = 'tree-structure'
    
    // Convert data to hierarchical tree
    const treeData = this.createTreeData(data)
    const treeHtml = this.renderTreeNode(treeData, 0)
    treeContainer.innerHTML = treeHtml
    
    analysisContent.appendChild(treeContainer)
    
    // Add expand/collapse event listeners
    this.bindTreeEvents(treeContainer)
    this.itemCount++
  }

  createTreeData(data) {
    if (Array.isArray(data)) {
      return {
        key: 'root',
        type: 'array',
        value: `Array(${data.length})`,
        children: data.map((item, index) => this.processTreeItem(item, index))
      }
    } else if (typeof data === 'object' && data !== null) {
      return this.processTreeItem(data)
    }
    return {
      key: 'value',
      type: typeof data,
      value: this.formatValue(data),
      children: []
    }
  }

  processTreeItem(item, index = null) {
    if (typeof item !== 'object' || item === null) {
      return {
        key: index !== null ? `[${index}]` : 'value',
        value: this.formatValue(item),
        type: typeof item,
        children: []
      }
    }

    const result = {
      key: item.name || (index !== null ? `[${index}]` : 'object'),
      type: 'object',
      children: []
    }

    // Process fields if available (for segments/records)
    if (item.fields && Array.isArray(item.fields)) {
      result.children = item.fields
        .filter(field => field.value && field.value.trim())
        .map(field => ({
          key: field.name,
          value: this.formatValue(field.value),
          type: typeof field.value,
          isPriority: this.priorityFields.has(field.name.toLowerCase()),
          children: []
        }))
    } 
    // Process regular object properties
    else {
      const entries = Object.entries(item)
        .filter(([key, value]) => key !== 'name' && value !== null && value !== undefined)
      
      // Sort to prioritize important fields
      entries.sort(([keyA], [keyB]) => {
        const aPriority = this.priorityFields.has(keyA.toLowerCase())
        const bPriority = this.priorityFields.has(keyB.toLowerCase())
        
        if (aPriority && !bPriority) return -1
        if (!aPriority && bPriority) return 1
        return 0
      })

      result.children = entries.map(([key, value]) => 
        this.createDeepTreeNode(key, value, 1)
      )
    }

    return result
  }

  createDeepTreeNode(key, value, depth) {
    if (depth > this.maxDepth || this.itemCount >= this.maxItems) {
      return {
        key,
        value: '(...)',
        type: 'truncated',
        children: []
      }
    }

    if (Array.isArray(value)) {
      const displayValue = value.length > 0 ? 
        `Array(${value.length}): ${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}` :
        `Array(0)`
      
      return {
        key,
        value: displayValue,
        type: 'array',
        isPriority: this.priorityFields.has(key.toLowerCase()),
        children: value.slice(0, 10).map((item, index) => 
          this.createDeepTreeNode(`[${index}]`, item, depth + 1)
        )
      }
    } else if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value)
      
      return {
        key,
        value: `Object(${entries.length})`,
        type: 'object',
        isPriority: this.priorityFields.has(key.toLowerCase()),
        children: entries.slice(0, 15).map(([subKey, subValue]) => 
          this.createDeepTreeNode(subKey, subValue, depth + 1)
        )
      }
    } else {
      return {
        key,
        value: this.formatValue(value),
        type: typeof value,
        isPriority: this.priorityFields.has(key.toLowerCase()),
        children: []
      }
    }
  }

  renderTreeNode(node, depth = 0) {
    if (!node || this.itemCount >= this.maxItems) return ''
    
    const hasChildren = node.children && node.children.length > 0
    const nodeId = `tree-node-${Math.random().toString(36).substr(2, 9)}`
    const isPriority = node.isPriority ? 'priority-field' : ''
    
    let html = `<div class="tree-node ${isPriority}" data-depth="${depth}">`
    
    // Node content
    html += `<div class="tree-item flex items-center">`
    
    if (hasChildren) {
      html += `<span class="tree-toggle" data-target="${nodeId}">-</span>`
    } else {
      html += `<span class="w-4 h-4 mr-2"></span>`
    }
    
    html += `<span class="tree-key">${this.escapeHtml(node.key)}</span>`
    html += `<span class="tree-type">(${node.type})</span>`
    
    if (node.value !== undefined) {
      html += `<span class="tree-value">${this.escapeHtml(node.value)}</span>`
    }
    
    html += `</div>`
    
    // Children
    if (hasChildren) {
      html += `<div id="${nodeId}" class="tree-line tree-expanded">`
      for (const child of node.children) {
        html += this.renderTreeNode(child, depth + 1)
        this.itemCount++
        if (this.itemCount >= this.maxItems) break
      }
      html += `</div>`
    }
    
    html += `</div>`
    
    return html
  }

  bindTreeEvents(container) {
    const toggles = container.querySelectorAll('.tree-toggle')
    
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault()
        const targetId = toggle.getAttribute('data-target')
        const target = document.getElementById(targetId)
        
        if (target) {
          if (target.classList.contains('tree-expanded')) {
            target.classList.remove('tree-expanded')
            target.classList.add('tree-collapsed')
            toggle.textContent = '+'
          } else {
            target.classList.remove('tree-collapsed')
            target.classList.add('tree-expanded')
            toggle.textContent = '-'
          }
        }
      })
    })
  }

  formatValue(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    
    const str = String(value)
    if (str.length > 255) {
      return str.substring(0, 255) + '(...)'
    }
    return str
  }

  addAnalysisSection(title, items) {
    if (this.itemCount >= this.maxItems) return
    
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
      if (this.itemCount >= this.maxItems) break
      
      const itemDiv = document.createElement('div')
      itemDiv.className = 'analysis-item pl-4 border-l-2 border-gray-200'
      
      let content = `<div class="analysis-label">${this.escapeHtml(item.name)}</div>`
      
      if (item.fields && item.fields.length > 0) {
        content += '<div class="analysis-value">'
        for (const field of item.fields.slice(0, 10)) {
          if (field.value) {
            content += `<div class="text-xs mb-1"><span class="font-medium">${this.escapeHtml(field.name)}:</span> ${this.escapeHtml(this.formatValue(field.value))}</div>`
          }
        }
        content += '</div>'
      } else if (item.value) {
        content += `<div class="analysis-value">${this.escapeHtml(this.formatValue(item.value))}</div>`
      } else if (item.type) {
        content += `<div class="analysis-value">Type: ${this.escapeHtml(item.type)}</div>`
      }
      
      if (item.attributes && item.attributes.length > 0) {
        content += `<div class="analysis-value text-xs text-gray-500">Attributes: ${this.escapeHtml(item.attributes.slice(0, 5).join(', '))}${item.attributes.length > 5 ? '...' : ''}</div>`
      }
      
      if (item.hasChildren) {
        content += '<div class="analysis-value text-xs text-medical-blue">Has child elements</div>'
      }
      
      if (item.textContent) {
        content += `<div class="analysis-value text-xs font-mono bg-gray-50 p-2 rounded mt-1">${this.escapeHtml(this.formatValue(item.textContent))}</div>`
      }
      
      itemDiv.innerHTML = content
      analysisContent.appendChild(itemDiv)
      this.itemCount++
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