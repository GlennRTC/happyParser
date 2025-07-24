export class UIController {
  constructor() {
    this.currentResult = null
    this.itemCount = 0
    this.maxItems = 1000
    this.maxDepth = 15
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
    
    // Add clinical summary at the top
    this.displayClinicalSummary(analysis)
    
    // Display basic metadata (simplified)
    this.displayBasicAnalysis(analysis)
    
    // Display hierarchical structure for complex data (simplified)
    if (analysis.detailedStructure) {
      this.addSimplifiedTreeSection('Clinical Structure', analysis.detailedStructure)
    } else if (analysis.segments && analysis.segments.length > 0) {
      this.addSimplifiedAnalysisSection('Message Segments', analysis.segments)
    } else if (analysis.records && analysis.records.length > 0) {
      this.addSimplifiedAnalysisSection('Data Records', analysis.records)
    } else if (analysis.structure && analysis.structure.length > 0) {
      if (this.shouldUseTreeView(analysis.structure)) {
        this.addSimplifiedTreeSection('Data Structure', analysis.structure)
      } else {
        this.addSimplifiedAnalysisSection('Structure', analysis.structure)
      }
    }
    
    // Update count badge
    analysisCount.textContent = `${this.itemCount} items`
  }

  displayClinicalSummary(analysis) {
    const summaryDiv = document.createElement('div')
    summaryDiv.className = 'clinical-summary bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 dark:bg-blue-900/20 dark:border-blue-800'
    
    let summaryText = this.generateClinicalSummaryText(analysis)
    
    summaryDiv.innerHTML = `
      <div class="flex items-center mb-2">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h4 class="font-semibold text-blue-800 dark:text-blue-200">Clinical Summary</h4>
      </div>
      <p class="text-blue-700 dark:text-blue-300">${summaryText}</p>
    `
    
    const analysisContent = document.getElementById('analysisContent')
    analysisContent.appendChild(summaryDiv)
    this.itemCount++
  }

  generateClinicalSummaryText(analysis) {
    // Determine format and generate appropriate summary
    const format = this.currentResult?.format || 'unknown'
    
    switch (format.toLowerCase()) {
      case 'hl7v3':
      case 'cda':
        return this.generateCCDASummary(analysis)
      case 'fhir':
        return this.generateFHIRSummary(analysis)
      case 'hl7v2':
        return this.generateHL7v2Summary(analysis)
      case 'json':
        return this.generateJSONSummary(analysis)
      case 'xml':
        return this.generateXMLSummary(analysis)
      default:
        return this.generateGenericSummary(analysis)
    }
  }

  generateCCDASummary(analysis) {
    const patientName = this.extractPatientName(analysis)
    const docType = analysis.documentType || analysis.resourceType || 'Clinical Document'
    const sections = this.countClinicalSections(analysis)
    
    let summary = `Patient: ${patientName || 'Not specified'}, Document: ${docType}`
    if (sections > 0) {
      summary += `, ${sections} clinical sections`
    }
    if (analysis.recordCount) {
      summary += `, ${analysis.recordCount} records`
    }
    return summary
  }

  generateFHIRSummary(analysis) {
    const resourceType = analysis.resourceType || 'FHIR Resource'
    
    if (resourceType === 'Bundle') {
      // Find bundle data from the structure
      const bundleType = this.findNestedValue(analysis.structure, 'type') || 'collection'
      const entryArray = this.findNestedValue(analysis.structure, 'entry')
      const entryCount = Array.isArray(entryArray) ? entryArray.length : 0
      
      // Count different resource types in the bundle entries
      const resourceCounts = this.countBundleResourcesFromStructure(analysis.structure)
      const resourceSummary = Object.entries(resourceCounts)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ')
      
      return `Bundle: ${bundleType} with ${entryCount} entries (${resourceSummary || 'mixed resources'})`
    } else {
      const patientRef = this.extractPatientReference(analysis)
      const observations = this.countFHIRResources(analysis, 'observation')
      const medications = this.countFHIRResources(analysis, 'medication')
      
      let summary = `Resource: ${resourceType}`
      if (patientRef) {
        summary += `, Patient: ${patientRef}`
      }
      if (observations > 0) {
        summary += `, ${observations} observations`
      }
      if (medications > 0) {
        summary += `, ${medications} medications`
      }
      return summary
    }
  }

  findNestedValue(structure, targetField) {
    if (Array.isArray(structure)) {
      for (const item of structure) {
        const result = this.findNestedValue(item, targetField)
        if (result !== null) return result
      }
    } else if (typeof structure === 'object' && structure !== null) {
      if (structure.name === targetField && structure.value !== undefined) {
        return structure.value
      }
      if (structure.fields) {
        for (const field of structure.fields) {
          if (field.name === targetField && field.value !== undefined) {
            return field.value
          }
          const result = this.findNestedValue(field, targetField)
          if (result !== null) return result
        }
      }
    }
    return null
  }

  countBundleResourcesFromStructure(structure) {
    const counts = {}
    
    // Find the entry array in the structure
    const entryField = this.findFieldData(structure, 'entry')
    
    if (entryField && entryField.value && Array.isArray(entryField.value)) {
      for (const entry of entryField.value) {
        if (entry.fields) {
          const resourceField = entry.fields.find(f => f.name === 'resource')
          if (resourceField && resourceField.fields) {
            const resourceTypeField = resourceField.fields.find(f => f.name === 'resourceType')
            if (resourceTypeField && resourceTypeField.value) {
              const resourceType = resourceTypeField.value
              counts[resourceType] = (counts[resourceType] || 0) + 1
            }
          }
        }
      }
    }
    
    return counts
  }

  countBundleResources(entries) {
    const counts = {}
    
    if (entries && entries.value && Array.isArray(entries.value)) {
      for (const entry of entries.value) {
        if (entry.fields) {
          const resourceField = entry.fields.find(f => f.name === 'resource')
          if (resourceField && resourceField.fields) {
            const resourceTypeField = resourceField.fields.find(f => f.name === 'resourceType')
            if (resourceTypeField) {
              const resourceType = resourceTypeField.value
              counts[resourceType] = (counts[resourceType] || 0) + 1
            }
          }
        }
      }
    }
    
    return counts
  }

  generateHL7v2Summary(analysis) {
    const messageType = analysis.messageType || 'HL7 Message'
    const patientName = this.extractPatientName(analysis)
    const segments = analysis.segmentCount || 0
    
    let summary = `Message: ${messageType}`
    if (patientName) {
      summary += `, Patient: ${patientName}`
    }
    if (segments > 0) {
      summary += `, ${segments} segments`
    }
    return summary
  }

  generateJSONSummary(analysis) {
    const elements = analysis.elementCount || 0
    const depth = analysis.depth || 0
    return `JSON Document: ${elements} elements, ${depth} levels deep`
  }

  generateXMLSummary(analysis) {
    const rootElement = analysis.rootElement || 'XML Document'
    const elements = analysis.elementCount || 0
    return `XML Document: Root element "${rootElement}", ${elements} elements`
  }

  generateGenericSummary(analysis) {
    const type = analysis.type || analysis.format || 'Document'
    const size = analysis.size ? this.formatBytes(analysis.size) : null
    return `${type}${size ? ` (${size})` : ''}`
  }

  extractPatientName(analysis) {
    // Try to find patient name in various structures
    if (analysis.structure) {
      for (const item of analysis.structure) {
        if (item.name && item.name.toLowerCase().includes('patient')) {
          if (item.fields) {
            const nameField = item.fields.find(f => 
              f.name && (f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('given') || f.name.toLowerCase().includes('family'))
            )
            if (nameField && nameField.value) {
              return nameField.value
            }
          }
        }
      }
    }
    return null
  }

  extractPatientReference(analysis) {
    // Similar logic for FHIR patient references
    if (analysis.structure) {
      for (const item of analysis.structure) {
        if (item.fields) {
          const patientRef = item.fields.find(f => 
            f.name && f.name.toLowerCase().includes('patient') && f.value
          )
          if (patientRef) {
            return patientRef.value
          }
        }
      }
    }
    return null
  }

  countClinicalSections(analysis) {
    if (!analysis.structure) return 0
    return analysis.structure.filter(item => 
      item.name && (
        item.name.toLowerCase().includes('section') ||
        item.name.toLowerCase().includes('component') ||
        item.name.toLowerCase().includes('entry')
      )
    ).length
  }

  countFHIRResources(analysis, resourceType) {
    if (!analysis.structure) return 0
    return analysis.structure.filter(item => 
      item.name && item.name.toLowerCase().includes(resourceType)
    ).length
  }

  displayBasicAnalysis(analysis) {
    // Only show the most relevant clinical information
    if (analysis.messageType) {
      this.addAnalysisItem('Message Type', analysis.messageType)
    }
    
    if (analysis.resourceType) {
      this.addAnalysisItem('Resource Type', analysis.resourceType)
    }
    
    if (analysis.documentType) {
      this.addAnalysisItem('Document Type', analysis.documentType)
    }
    
    if (analysis.version) {
      this.addAnalysisItem('Version', analysis.version)
    }
    
    // Show counts that matter clinically
    if (analysis.segmentCount) {
      this.addAnalysisItem('Segments', analysis.segmentCount.toString())
    }
    
    if (analysis.recordCount) {
      this.addAnalysisItem('Records', analysis.recordCount.toString())
    }
    
    if (analysis.elementCount && analysis.elementCount < 100) {
      this.addAnalysisItem('Elements', analysis.elementCount.toString())
    }
    
    if (analysis.size) {
      this.addAnalysisItem('Document Size', this.formatBytes(analysis.size))
    }
    
    // Skip technical details like templateId, namespaces, etc.
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
    if (str.length > 500) {
      return str.substring(0, 500) + '(...)'
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

  // Simplified versions for clinical focus
  addSimplifiedTreeSection(title, data) {
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
    
    // Create simplified tree structure
    const treeContainer = document.createElement('div')
    treeContainer.className = 'tree-structure'
    
    // Convert data to simplified hierarchical tree
    const treeData = this.createSimplifiedTreeData(data)
    const treeHtml = this.renderSimplifiedTreeNode(treeData, 0)
    treeContainer.innerHTML = treeHtml
    
    analysisContent.appendChild(treeContainer)
    
    // Add expand/collapse event listeners
    this.bindTreeEvents(treeContainer)
    this.itemCount++
  }

  addSimplifiedAnalysisSection(title, items) {
    if (this.itemCount >= this.maxItems) return
    
    const analysisContent = document.getElementById('analysisContent')
    
    // Add section header
    const header = document.createElement('div')
    header.className = 'analysis-item border-t-2 border-medical-blue pt-3 mt-3'
    header.innerHTML = `
      <div class="analysis-label text-medical-blue">${this.escapeHtml(title)}</div>
    `
    analysisContent.appendChild(header)
    
    // Add simplified items (filter out technical details)
    for (const item of items) {
      if (this.itemCount >= this.maxItems) break
      
      // Skip technical segments/items
      if (this.shouldSkipTechnicalItem(item)) continue
      
      const itemDiv = document.createElement('div')
      itemDiv.className = 'analysis-item pl-4 border-l-2 border-gray-200'
      
      let content = `<div class="analysis-label">${this.escapeHtml(this.getFriendlyName(item.name))}</div>`
      
      if (item.fields && item.fields.length > 0) {
        content += '<div class="analysis-value">'
        // Only show clinically relevant fields
        const relevantFields = item.fields.filter(field => this.isClinicallyRelevant(field))
        for (const field of relevantFields.slice(0, 5)) {
          if (field.value) {
            const dataType = this.getDataType(field.value)
            content += `<div class="text-xs mb-1">
              <span class="font-medium">${this.escapeHtml(this.getFriendlyName(field.name))}:</span> 
              <span title="Data type: ${dataType}" class="cursor-help">${this.escapeHtml(this.formatValue(field.value))}</span>
            </div>`
          }
        }
        content += '</div>'
      } else if (item.value) {
        const dataType = this.getDataType(item.value)
        content += `<div class="analysis-value" title="Data type: ${dataType}">${this.escapeHtml(this.formatValue(item.value))}</div>`
      }
      
      itemDiv.innerHTML = content
      analysisContent.appendChild(itemDiv)
      this.itemCount++
    }
  }

  createSimplifiedTreeData(data) {
    // For C-CDA and similar structured documents, create a proper hierarchical view
    const format = this.currentResult?.format || ''
    
    if (format.toLowerCase() === 'hl7v3' || format.toLowerCase() === 'cda') {
      // Use the standard deep processing with full field processing for C-CDA
      if (Array.isArray(data)) {
        return {
          key: 'ClinicalDocument (C-CDA)',
          type: 'document',
          value: 'HL7 v3 namespace',
          children: data.map((item, index) => this.processDeepTreeItem(item, index, 0))
        }
      } else {
        return this.processDeepTreeItem(data, null, 0, 'ClinicalDocument (C-CDA)')
      }
    } else if (format.toLowerCase() === 'fhir') {
      return this.createFHIRTreeStructure(data)
    } else if (Array.isArray(data)) {
      return {
        key: 'Document Structure',
        type: 'document',
        value: `${data.length} sections`,
        children: data.filter(item => !this.shouldSkipTechnicalItem(item))
                    .map((item, index) => this.processDeepTreeItem(item, index, 0))
      }
    } else if (typeof data === 'object' && data !== null) {
      return this.processDeepTreeItem(data, null, 0)
    }
    return {
      key: 'value',
      type: typeof data,
      value: this.formatValue(data),
      children: []
    }
  }

  createCCDAEnhancedStructure(data) {
    if (Array.isArray(data)) {
      return {
        key: 'ClinicalDocument (C-CDA)',
        type: 'document', 
        value: 'HL7 v3 namespace',
        children: data.map((item, index) => this.processCCDAItem(item, index, 0))
      }
    } else if (typeof data === 'object' && data !== null) {
      return this.processCCDAItem(data, null, 0, 'ClinicalDocument (C-CDA)')
    }
    return {
      key: 'ClinicalDocument (C-CDA)',
      type: 'document',
      value: 'HL7 v3 namespace',
      children: []
    }
  }

  processCCDAItem(item, index = null, depth = 0, parentKey = null) {
    if (depth > 12 || this.itemCount >= this.maxItems) {
      return {
        key: '...',
        value: '(truncated)',
        type: 'truncated',
        children: []
      }
    }

    if (typeof item !== 'object' || item === null) {
      return {
        key: parentKey || (index !== null ? `[${index}]` : 'value'),
        value: this.formatClinicalValue(item),
        type: this.getDataType(item),
        children: []
      }
    }

    // Handle arrays  
    if (Array.isArray(item)) {
      return {
        key: parentKey || 'array',
        type: `array[${item.length}]`,
        children: item.slice(0, 25).map((element, idx) => 
          this.processCCDAItem(element, idx, depth + 1)
        )
      }
    }

    const result = {
      key: this.getCCDAFriendlyName(parentKey || item.name) || (index !== null ? `Section ${index + 1}` : 'Section'),
      type: 'section',
      children: []
    }

    // Process fields with C-CDA specific handling
    if (item.fields && Array.isArray(item.fields)) {
      for (const field of item.fields.slice(0, 40)) { // Increased for C-CDA
        if (field.value !== null && field.value !== undefined) {
          // Skip technical fields unless they're important for C-CDA
          if (this.shouldIncludeCCDAField(field.name)) {
            if (typeof field.value === 'object' && field.value !== null) {
              // Recursive processing for nested C-CDA structures
              const childNode = this.processCCDAItem(field.value, null, depth + 1, field.name)
              if (childNode.children.length > 0 || childNode.value) {
                result.children.push(childNode)
              }
            } else {
              result.children.push({
                key: this.getCCDAFriendlyName(field.name),
                value: this.formatClinicalValue(field.value),
                type: this.getDataType(field.value),
                isPriority: this.isCCDAPriorityField(field.name),
                children: []
              })
            }
          }
        }
      }
    } 
    // Process regular object properties
    else {
      const entries = Object.entries(item)
        .filter(([key, value]) => {
          if (key === 'name') return false
          if (value === null || value === undefined) return false
          return this.shouldIncludeCCDAField(key)
        })
        .slice(0, 40) // Increased for C-CDA

      for (const [key, value] of entries) {
        if (typeof value === 'object' && value !== null) {
          // Recursive processing for nested objects
          const childNode = this.processCCDAItem(value, null, depth + 1, key)
          if (childNode.children.length > 0 || childNode.value) {
            result.children.push(childNode)
          }
        } else {
          result.children.push({
            key: this.getCCDAFriendlyName(key),
            value: this.formatClinicalValue(value),
            type: this.getDataType(value),
            isPriority: this.isCCDAPriorityField(key),
            children: []
          })
        }
      }
    }

    return result
  }

  shouldIncludeCCDAField(fieldName) {
    if (!fieldName) return false
    
    // Skip some technical fields but keep important ones
    const skipFields = [
      'xmlns', 'schemaLocation', 'xsi', 'nullFlavor'
    ]
    
    const includeImportantFields = [
      'templateId', 'classCode', 'moodCode', 'typeCode', 'use', 
      'realmCode', 'id', 'code', 'title', 'text', 'value', 'display',
      'effectiveTime', 'confidentialityCode', 'languageCode',
      'recordTarget', 'author', 'custodian', 'component', 'section',
      'patient', 'name', 'addr', 'telecom', 'birthTime', 'administrativeGenderCode',
      'assignedAuthor', 'assignedPerson', 'representedOrganization',
      'structuredBody', 'entry', 'observation', 'organizer'
    ]
    
    const name = fieldName.toLowerCase()
    
    // Always skip certain fields
    if (skipFields.some(skip => name.includes(skip))) return false
    
    // Always include important fields
    if (includeImportantFields.some(include => name.includes(include))) return true
    
    // Include clinically relevant fields
    return this.isClinicallyRelevant({name: fieldName})
  }

  isCCDAPriorityField(fieldName) {
    if (!fieldName) return false
    
    const priorityFields = [
      'id', 'code', 'title', 'name', 'value', 'display', 'status',
      'effectiveTime', 'birthTime', 'patient', 'subject'
    ]
    
    return priorityFields.some(field => fieldName.toLowerCase().includes(field))
  }

  getCCDAFriendlyName(name) {
    if (!name) return name
    
    const ccdaFriendlyNames = {
      'ClinicalDocument': 'ClinicalDocument (C-CDA)',
      'realmCode': 'Realm Code',
      'typeId': 'Type ID',
      'templateId': 'Template ID',
      'effectiveTime': 'Document Date',
      'confidentialityCode': 'Confidentiality',
      'languageCode': 'Language',
      'recordTarget': 'Patient Information',
      'patientRole': 'Patient Role',
      'assignedAuthor': 'Document Author',
      'assignedPerson': 'Author Person',
      'custodian': 'Document Custodian',
      'assignedCustodian': 'Assigned Custodian',
      'representedCustodianOrganization': 'Custodian Organization',
      'componentOf': 'Healthcare Encounter',
      'encompassingEncounter': 'Encompassing Encounter',
      'structuredBody': 'Document Body',
      'component': 'Document Component',
      'section': 'Clinical Section',
      'birthTime': 'Date of Birth',
      'administrativeGenderCode': 'Gender',
      'addr': 'Address',
      'telecom': 'Contact Information',
      'streetAddressLine': 'Street Address',
      'postalCode': 'Postal Code'
    }
    
    return ccdaFriendlyNames[name] || this.getFriendlyName(name)
  }

  getContextualFriendlyName(name) {
    if (!name) return name
    
    const format = this.currentResult?.format || ''
    
    if (format.toLowerCase() === 'hl7v3' || format.toLowerCase() === 'cda') {
      return this.getCCDAFriendlyName(name)
    }
    
    return this.getFriendlyName(name)
  }

  createCCDATreeStructure(data) {
    return {
      key: 'ClinicalDocument (C-CDA)',
      type: 'document',
      value: 'HL7 v3 namespace',
      children: [
        this.createCCDASection('Document Metadata', data, [
          'realmCode', 'typeId', 'templateId', 'id', 'code', 'title', 
          'effectiveTime', 'confidentialityCode', 'languageCode'
        ]),
        this.createCCDASection('recordTarget (Patient Information)', data, ['recordTarget']),
        this.createCCDASection('author (Document Creator)', data, ['author']),
        this.createCCDASection('custodian (Document Custodian)', data, ['custodian']),
        this.createCCDASection('component (Document Body)', data, ['component'])
      ].filter(section => section.children.length > 0)
    }
  }

  createFHIRTreeStructure(data) {
    const resourceType = this.findFieldValue(data, 'resourceType') || 'FHIR Resource'
    const bundleId = this.findFieldValue(data, 'id')
    
    if (resourceType === 'Bundle') {
      return this.createFHIRBundleStructure(data, bundleId)
    } else {
      return {
        key: `${resourceType} (FHIR)`,
        type: 'resource',
        value: bundleId ? `ID: ${bundleId}` : 'FHIR namespace',
        children: this.processFHIRStructure(data)
      }
    }
  }

  createCCDASection(sectionName, data, fieldNames) {
    const children = []
    
    for (const fieldName of fieldNames) {
      const fieldData = this.findFieldData(data, fieldName)
      if (fieldData) {
        children.push(this.processDeepTreeItem(fieldData, null, 1, fieldName))
      }
    }
    
    return {
      key: sectionName,
      type: 'section',
      children: children
    }
  }

  processDeepTreeItem(item, index = null, depth = 0, parentKey = null) {
    if (depth > 10 || this.itemCount >= this.maxItems) {
      return {
        key: '...',
        value: '(truncated)',
        type: 'truncated',
        children: []
      }
    }

    if (typeof item !== 'object' || item === null) {
      return {
        key: parentKey || (index !== null ? `[${index}]` : 'value'),
        value: this.formatClinicalValue(item),
        type: this.getDataType(item),
        children: []
      }
    }

    // Handle arrays
    if (Array.isArray(item)) {
      return {
        key: parentKey || 'array',
        type: `array[${item.length}]`,
        children: item.slice(0, 50).map((element, idx) => 
          this.processDeepTreeItem(element, idx, depth + 1)
        )
      }
    }

    // Check if this is a table structure and process it specially
    if (this.isTableStructure(item)) {
      return this.processTableStructure(item, parentKey, depth)
    }

    const result = {
      key: this.getContextualFriendlyName(parentKey || item.name) || (index !== null ? `Item ${index + 1}` : 'object'),
      type: 'object',
      children: []
    }

    // Process fields if available (for HL7/CDA structure)
    if (item.fields && Array.isArray(item.fields)) {
      for (const field of item.fields.slice(0, 30)) {
        if (field.value && this.isClinicallyRelevant(field)) {
          result.children.push({
            key: this.getFriendlyName(field.name),
            value: this.formatClinicalValue(field.value),
            type: this.getDataType(field.value),
            isPriority: this.priorityFields.has(field.name.toLowerCase()),
            children: []
          })
        }
      }
    } 
    // Process regular object properties
    else {
      const entries = Object.entries(item)
        .filter(([key, value]) => {
          if (key === 'name') return false
          if (value === null || value === undefined) return false
          // Skip technical fields but keep some important ones
          if (this.shouldSkipTechnicalField(key)) return false
          return true
        })
        .slice(0, 100)

      for (const [key, value] of entries) {
        if (typeof value === 'object' && value !== null) {
          // Recursive processing for nested objects
          const childNode = this.processDeepTreeItem(value, null, depth + 1, key)
          if (childNode.children.length > 0 || childNode.value) {
            result.children.push(childNode)
          }
        } else {
          result.children.push({
            key: this.getFriendlyName(key),
            value: this.formatClinicalValue(value),
            type: this.getDataType(value),
            isPriority: this.priorityFields.has(key.toLowerCase()),
            children: []
          })
        }
      }
    }

    return result
  }

  findFieldData(data, fieldName) {
    if (Array.isArray(data)) {
      for (const item of data) {
        const found = this.findFieldData(item, fieldName)
        if (found) return found
      }
    } else if (typeof data === 'object' && data !== null) {
      if (data.name === fieldName) return data
      if (data.fields) {
        const field = data.fields.find(f => f.name === fieldName)
        if (field) return field
      }
      // Recursively search in nested objects
      for (const value of Object.values(data)) {
        if (typeof value === 'object' && value !== null) {
          const found = this.findFieldData(value, fieldName)
          if (found) return found
        }
      }
    }
    return null
  }

  findFieldValue(data, fieldName) {
    const fieldData = this.findFieldData(data, fieldName)
    return fieldData ? fieldData.value : null
  }

  formatClinicalValue(value) {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'object') return '[object]'
    
    const str = String(value)
    if (str.length > 100) {
      return str.substring(0, 100) + '...'
    }
    return str
  }

  shouldSkipTechnicalField(fieldName) {
    const format = this.currentResult?.format || ''
    
    // For C-CDA, be much less restrictive - only skip truly technical fields
    if (format.toLowerCase() === 'hl7v3' || format.toLowerCase() === 'cda') {
      const skipFields = ['xmlns', 'schemaLocation', 'xsi']
      return skipFields.some(skip => fieldName.toLowerCase().includes(skip))
    }
    
    // For other formats, use the full technical field list
    const technicalFields = [
      'xmlns', 'schemaLocation', 'xsi', 'classCode', 'moodCode', 
      'typeCode', 'nullFlavor', 'use', 'mediaType'
    ]
    return technicalFields.includes(fieldName.toLowerCase())
  }

  createFHIRBundleStructure(data, bundleId) {
    const bundleType = this.findFieldValue(data, 'type') || 'collection'
    const entries = this.findFieldData(data, 'entry')
    const entryCount = entries && Array.isArray(entries.value) ? entries.value.length : 0
    
    return {
      key: `Bundle (FHIR)`,
      type: 'bundle',
      value: `${bundleType} - ${entryCount} entries`,
      children: [
        {
          key: 'Bundle Metadata',
          type: 'section',
          children: [
            { key: 'id', value: bundleId, type: 'string', children: [] },
            { key: 'type', value: bundleType, type: 'string', children: [] },
            ...this.extractBundleMetadata(data)
          ].filter(item => item.value)
        },
        {
          key: `Entries (${entryCount} resources)`,
          type: 'section',
          children: this.processBundleEntries(entries, entryCount)
        }
      ]
    }
  }

  extractBundleMetadata(data) {
    const metadata = []
    const metaData = this.findFieldData(data, 'meta')
    
    if (metaData && metaData.fields) {
      for (const field of metaData.fields) {
        if (field.name === 'lastUpdated' && field.value) {
          metadata.push({
            key: 'lastUpdated',
            value: field.value,
            type: 'dateTime',
            children: []
          })
        }
      }
    }
    
    return metadata
  }

  processBundleEntries(entries, entryCount) {
    if (!entries || !entries.value || !Array.isArray(entries.value)) {
      return []
    }

    const entryChildren = []
    
    // Group entries by resource type for better organization
    const groupedEntries = {}
    
    for (const entry of entries.value.slice(0, 50)) { // Increased limit
      if (entry.fields) {
        const resourceField = entry.fields.find(f => f.name === 'resource')
        if (resourceField && resourceField.fields) {
          const resourceTypeField = resourceField.fields.find(f => f.name === 'resourceType')
          const resourceType = resourceTypeField ? resourceTypeField.value : 'Unknown'
          
          if (!groupedEntries[resourceType]) {
            groupedEntries[resourceType] = []
          }
          groupedEntries[resourceType].push(resourceField)
        }
      }
    }

    // Create tree structure for each resource type
    for (const [resourceType, resources] of Object.entries(groupedEntries)) {
      entryChildren.push({
        key: `${resourceType} Resources (${resources.length})`,
        type: 'resourceGroup',
        children: resources.map((resource, index) => 
          this.processFHIRResource(resource, resourceType, index + 1)
        )
      })
    }

    return entryChildren
  }

  processFHIRResource(resource, resourceType, index) {
    const resourceId = this.findResourceField(resource, 'id')
    const status = this.findResourceField(resource, 'status')
    
    const resourceNode = {
      key: `${resourceType} #${index}`,
      type: 'resource',
      value: resourceId ? `ID: ${resourceId}` : '',
      children: []
    }

    // Add key clinical fields based on resource type
    if (resourceType === 'Observation') {
      resourceNode.children = this.processObservationResource(resource)
    } else {
      // Generic resource processing
      resourceNode.children = this.processGenericFHIRResource(resource)
    }

    return resourceNode
  }

  processObservationResource(resource) {
    const children = []
    
    // Add key observation fields
    const keyFields = ['id', 'status', 'code', 'subject', 'encounter', 'effectiveDateTime', 'valueQuantity']
    
    for (const fieldName of keyFields) {
      const fieldData = this.findResourceField(resource, fieldName)
      if (fieldData) {
        if (fieldName === 'code' || fieldName === 'valueQuantity') {
          children.push(this.processComplexField(fieldName, fieldData, resource))
        } else {
          children.push({
            key: this.getFriendlyName(fieldName),
            value: fieldData,
            type: this.getDataType(fieldData),
            children: []
          })
        }
      }
    }

    return children
  }

  processComplexField(fieldName, fieldData, resource) {
    if (fieldName === 'code') {
      const coding = this.findNestedResourceField(resource, ['code', 'coding'])
      if (coding && Array.isArray(coding)) {
        const firstCoding = coding[0]
        if (firstCoding) {
          const code = this.findNestedFieldValue(firstCoding, 'code')
          const display = this.findNestedFieldValue(firstCoding, 'display')
          return {
            key: 'Test Code',
            value: display ? `${code} (${display})` : code,
            type: 'coding',
            children: []
          }
        }
      }
    } else if (fieldName === 'valueQuantity') {
      const value = this.findNestedResourceField(resource, ['valueQuantity', 'value'])
      const unit = this.findNestedResourceField(resource, ['valueQuantity', 'unit'])
      return {
        key: 'Result Value',
        value: unit ? `${value} ${unit}` : value,
        type: 'quantity',
        children: []
      }
    }
    
    return {
      key: this.getFriendlyName(fieldName),
      value: fieldData,
      type: this.getDataType(fieldData),
      children: []
    }
  }

  findResourceField(resource, fieldName) {
    if (resource.fields) {
      const field = resource.fields.find(f => f.name === fieldName)
      return field ? field.value : null
    }
    return null
  }

  findNestedResourceField(resource, fieldPath) {
    let current = resource
    
    for (const fieldName of fieldPath) {
      if (current.fields) {
        const field = current.fields.find(f => f.name === fieldName)
        if (field) {
          current = field
        } else {
          return null
        }
      } else {
        return null
      }
    }
    
    return current.value
  }

  findNestedFieldValue(field, targetField) {
    if (field.fields) {
      const found = field.fields.find(f => f.name === targetField)
      return found ? found.value : null
    }
    return null
  }

  processGenericFHIRResource(resource) {
    const children = []
    
    if (resource.fields) {
      for (const field of resource.fields.slice(0, 25)) { // Increased limit
        if (this.isClinicallyRelevant(field) && field.value) {
          children.push({
            key: this.getFriendlyName(field.name),
            value: this.formatClinicalValue(field.value),
            type: this.getDataType(field.value),
            children: []
          })
        }
      }
    }
    
    return children
  }

  processFHIRStructure(data) {
    // Similar processing for FHIR resources
    const children = []
    
    if (Array.isArray(data)) {
      for (const item of data.slice(0, 25)) { // Increased limit
        children.push(this.processDeepTreeItem(item, null, 0))
      }
    } else if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data)
        .filter(([key, value]) => !this.shouldSkipTechnicalField(key))
        .slice(0, 25) // Increased limit
      
      for (const [key, value] of entries) {
        children.push(this.processDeepTreeItem(value, null, 0, key))
      }
    }
    
    return children
  }

  renderSimplifiedTreeNode(node, depth = 0) {
    if (!node || this.itemCount >= this.maxItems) return ''
    
    const hasChildren = node.children && node.children.length > 0
    const nodeId = `tree-node-${Math.random().toString(36).substr(2, 9)}`
    const isPriority = node.isPriority ? 'priority-field' : ''
    
    let html = `<div class="tree-node ${isPriority}" data-depth="${depth}">`
    
    // Node content - format like your expected output
    html += `<div class="tree-item flex items-start">`
    
    if (hasChildren) {
      html += `<span class="tree-toggle" data-target="${nodeId}">├──</span>`
    } else {
      html += `<span class="w-6 mr-1">└──</span>`
    }
    
    // Format the node content properly
    if (node.value && node.value !== '[object]') {
      // For leaf nodes with values, show key: "value" (type)
      html += `<span class="tree-key font-medium">${this.escapeHtml(node.key)}:</span>`
      html += `<span class="tree-value ml-2" title="Data type: ${node.type}">"${this.escapeHtml(node.value)}"</span>`
      if (node.type !== 'string') {
        html += `<span class="tree-type text-gray-500 ml-1">(${node.type})</span>`
      }
    } else {
      // For parent nodes, show key (type)
      html += `<span class="tree-key font-medium">${this.escapeHtml(node.key)}</span>`
      if (node.type && node.type !== 'object' && node.type !== 'section') {
        html += `<span class="tree-type text-gray-500 ml-1">(${node.type})</span>`
      }
      if (node.value && node.value !== '[object]') {
        html += `<span class="tree-value ml-2 text-gray-600">${this.escapeHtml(node.value)}</span>`
      }
    }
    
    html += `</div>`
    
    // Children with proper indentation
    if (hasChildren) {
      html += `<div id="${nodeId}" class="tree-line tree-expanded ml-4">`
      for (const child of node.children) {
        html += this.renderSimplifiedTreeNode(child, depth + 1)
        this.itemCount++
        if (this.itemCount >= this.maxItems) break
      }
      html += `</div>`
    }
    
    html += `</div>`
    
    return html
  }

  shouldSkipTechnicalItem(item) {
    if (!item || !item.name) return false
    
    const technicalTerms = [
      'templateId', 'xmlns', 'schemaLocation', 'namespace', 'oid', 'extension',
      'classCode', 'moodCode', 'typeCode', 'nullFlavor', 'root', 'displayName'
    ]
    
    const name = item.name.toLowerCase()
    return technicalTerms.some(term => name.includes(term))
  }

  isClinicallyRelevant(field) {
    if (!field || !field.name) return false
    
    const clinicalTerms = [
      'patient', 'name', 'birth', 'gender', 'address', 'phone', 'id', 'mrn',
      'medication', 'allergy', 'problem', 'diagnosis', 'procedure', 'test', 'result',
      'value', 'code', 'display', 'text', 'title', 'time', 'date', 'status',
      'physician', 'provider', 'hospital', 'encounter', 'visit', 'admission'
    ]
    
    const name = field.name.toLowerCase()
    return clinicalTerms.some(term => name.includes(term))
  }

  getFriendlyName(name) {
    if (!name) return name
    
    const friendlyNames = {
      'patientRole': 'Patient Information',
      'assignedAuthor': 'Healthcare Provider',
      'componentOf': 'Healthcare Encounter',
      'recordTarget': 'Patient Record',
      'custodian': 'Healthcare Organization',
      'templateId': 'Document Template',
      'effectiveTime': 'Document Date',
      'confidentialityCode': 'Privacy Level',
      'birthTime': 'Date of Birth',
      'administrativeGenderCode': 'Gender',
      'addr': 'Address',
      'telecom': 'Contact Information'
    }
    
    return friendlyNames[name] || name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
  }

  getDataType(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (Array.isArray(value)) return `array[${value.length}]`
    if (typeof value === 'object') return 'object'
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date'
      if (/^\d+$/.test(value)) return 'numeric string'
      if (value.length > 50) return 'text'
      return 'string'
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return 'integer'
      return 'float'
    }
    return typeof value
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

  isTableStructure(item) {
    // Check if this object represents a table structure
    if (typeof item !== 'object' || item === null) return false
    
    // Look for table elements: thead, tbody, tr, th, td
    const hasTableElements = item.thead || item.tbody || item.tr || 
                            (item.th && Array.isArray(item.th)) || 
                            (item.td && Array.isArray(item.td))
    
    if (hasTableElements) return true
    
    // Check if it's a table with @attributes border/width (common in C-CDA)
    if (item['@attributes'] && 
        (item['@attributes'].border || item['@attributes'].width) &&
        (item.thead || item.tbody)) {
      return true
    }
    
    return false
  }

  processTableStructure(item, parentKey, depth) {
    const result = {
      key: this.getContextualFriendlyName(parentKey) || 'Table',
      type: 'table',
      children: []
    }

    // Extract table attributes if available
    if (item['@attributes']) {
      const attrs = item['@attributes']
      let tableInfo = []
      if (attrs.border) tableInfo.push(`border="${attrs.border}"`)
      if (attrs.width) tableInfo.push(`width="${attrs.width}"`)
      if (tableInfo.length > 0) {
        result.value = tableInfo.join(', ')
      }
    }

    // Process table headers
    let headers = []
    if (item.thead && item.thead.tr) {
      const headerRow = Array.isArray(item.thead.tr) ? item.thead.tr[0] : item.thead.tr
      if (headerRow.th) {
        headers = Array.isArray(headerRow.th) ? 
                 headerRow.th.map(th => this.extractTextContent(th)) :
                 [this.extractTextContent(headerRow.th)]
      }
    }

    // Process table body and create key-value pairs
    if (item.tbody && item.tbody.tr) {
      const rows = Array.isArray(item.tbody.tr) ? item.tbody.tr : [item.tbody.tr]
      
      rows.forEach((row, rowIndex) => {
        if (row.td) {
          const cells = Array.isArray(row.td) ? row.td : [row.td]
          
          // Create a row node
          const rowNode = {
            key: `Row ${rowIndex + 1}`,
            type: 'tableRow',
            children: []
          }

          // Map cells to headers for key-value pairs
          cells.forEach((cell, cellIndex) => {
            const cellContent = this.extractTextContent(cell)
            const header = headers[cellIndex] || `Column ${cellIndex + 1}`
            
            // Create key-value pair like "Test: NEUT%"
            rowNode.children.push({
              key: header,
              value: cellContent,
              type: this.getDataType(cellContent),
              children: []
            })
          })

          result.children.push(rowNode)
        }
      })
    }

    // If no tbody but direct tr elements
    else if (item.tr) {
      const rows = Array.isArray(item.tr) ? item.tr : [item.tr]
      
      rows.forEach((row, rowIndex) => {
        // Skip header row if it exists
        if (rowIndex === 0 && row.th) {
          if (!headers.length) {
            headers = Array.isArray(row.th) ? 
                     row.th.map(th => this.extractTextContent(th)) :
                     [this.extractTextContent(row.th)]
          }
          return
        }

        if (row.td) {
          const cells = Array.isArray(row.td) ? row.td : [row.td]
          
          const rowNode = {
            key: `Row ${rowIndex + (headers.length ? 0 : 1)}`,
            type: 'tableRow',
            children: []
          }

          cells.forEach((cell, cellIndex) => {
            const cellContent = this.extractTextContent(cell)
            const header = headers[cellIndex] || `Column ${cellIndex + 1}`
            
            rowNode.children.push({
              key: header,
              value: cellContent,
              type: this.getDataType(cellContent),
              children: []
            })
          })

          result.children.push(rowNode)
        }
      })
    }

    return result
  }

  extractTextContent(element) {
    if (typeof element === 'string') {
      return element.trim()
    }
    if (typeof element === 'object' && element !== null) {
      if (element['#text']) {
        return element['#text'].trim()
      }
      if (element.textContent) {
        return element.textContent.trim()
      }
      // If it's an object, try to extract meaningful content
      const values = Object.values(element).filter(v => 
        typeof v === 'string' && v.trim().length > 0
      )
      if (values.length > 0) {
        return values[0].trim()
      }
    }
    return String(element).trim()
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