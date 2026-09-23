export class UIController {
  constructor() {
    this.currentResult = null
    this.itemCount = 0
    this.maxItems = 5000
    this.maxDepth = 40
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
    
    if (this.itemCount >= this.maxItems) {
      const note = document.createElement('div')
      note.className = 'analysis-item text-xs text-gray-500'
      note.textContent = `Showing the first ${this.maxItems} items. The Formatted tab has the complete message.`
      analysisContent.appendChild(note)
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
      <p class="text-blue-700 dark:text-blue-300">${this.escapeHtml(summaryText)}</p>
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
      case 'astm':
        return this.generateASTMSummary(analysis)
      default:
        return this.generateGenericSummary(analysis)
    }
  }

  generateCCDASummary(analysis) {
    let summary = `Patient: ${analysis.patientName || 'Not specified'}, Document: ${analysis.documentType || 'Clinical Document'}`
    if (analysis.sectionCount) summary += `, ${analysis.sectionCount} clinical sections`
    return summary
  }

  generateFHIRSummary(analysis) {
    const patient = analysis.patientName ? `, Patient: ${analysis.patientName}` : ''
    if (analysis.resourceType !== 'Bundle') return `Resource: ${analysis.resourceType || 'FHIR Resource'}${patient}`
    const counts = Object.entries(analysis.resourceCounts || {}).map(([t, n]) => `${n} ${t}${n > 1 ? 's' : ''}`).join(', ')
    return `Bundle: ${analysis.bundleType || 'collection'} with ${analysis.entryCount || 0} entries (${counts || 'no resources'})${patient}`
  }

  generateHL7v2Summary(analysis) {
    let summary = `Message: ${analysis.messageType || 'HL7 Message'}`
    if (analysis.patientName) summary += `, Patient: ${analysis.patientName}`
    if (analysis.segmentCount) summary += `, ${analysis.segmentCount} segments`
    return summary
  }

  generateASTMSummary(analysis) {
    let summary = `ASTM: ${analysis.recordCount} records`
    if (analysis.patientName) summary += `, Patient: ${analysis.patientName}`
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
      
      const itemDiv = document.createElement('div')
      itemDiv.className = 'analysis-item pl-4 border-l-2 border-gray-200'
      
      let content = `<div class="analysis-label">${this.escapeHtml(this.getFriendlyName(item.name))}</div>`
      
      if (item.fields && item.fields.length > 0) {
        content += '<div class="analysis-value">'
        // Only show clinically relevant fields
        for (const field of item.fields) {
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
        children: data.map((item, index) => this.processDeepTreeItem(item, index, 0))
      }
    } else if (typeof data === 'object' && data !== null) {
      return this.processDeepTreeItem(data, null, 0, `${format.toUpperCase()} Message`)
    }
    return {
      key: 'value',
      type: typeof data,
      value: this.formatValue(data),
      children: []
    }
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

  createFHIRTreeStructure(data) {
    const label = r => `${r?.resourceType || 'Resource'}${r?.id ? '/' + r.id : ''}`
    if (data.resourceType !== 'Bundle') return this.processDeepTreeItem(data, null, 0, `${label(data)} (FHIR)`)
    const { entry = [], ...meta } = data
    return {
      key: 'Bundle (FHIR)',
      type: 'bundle',
      value: `${data.type || 'collection'} - ${entry.length} entries`,
      children: [
        this.processDeepTreeItem(meta, null, 1, 'Bundle Metadata'),
        ...entry.map((e, i) => this.processDeepTreeItem(e, i, 1, `${i + 1}. ${label(e.resource)}`))
      ]
    }
  }

  processDeepTreeItem(item, index = null, depth = 0, parentKey = null) {
    if (depth > this.maxDepth || this.itemCount >= this.maxItems) {
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
        children: item.map((element, idx) => 
          this.processDeepTreeItem(element, idx, depth + 1)
        )
      }
    }

    // Check if this is a table structure and process it specially
    if (this.isTableStructure(item)) {
      return this.processTableStructure(item, parentKey)
    }

    const result = {
      key: this.getContextualFriendlyName(parentKey) || (index !== null ? `Item ${index + 1}` : 'object'),
      type: 'object',
      children: []
    }

    // Process regular object properties
    const entries = Object.entries(item)
      .filter(([key, value]) => {
        if (value === null || value === undefined) return false
        // Skip technical fields but keep some important ones
        if (this.shouldSkipTechnicalField(key)) return false
        return true
      })

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

    return result
  }

  formatClinicalValue(value) {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'object') return '[object]'
    
    const str = String(value)
    if (str.length > 500) {
      return str.substring(0, 500) + '...'
    }
    return str
  }

  shouldSkipTechnicalField(fieldName) {
    return /^(xmlns|xsi:|schemaLocation)/.test(fieldName)
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
    
    return friendlyNames[name] || name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase())
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

  processTableStructure(item, parentKey) {
    const list = v => [v].flat().filter(Boolean)
    const rowsOf = section => list(item[section]).flatMap(s => list(s.tr))
    const cellsOf = row => [...list(row.th), ...list(row.td)]
    const bodyRows = [...list(item.tr), ...rowsOf('tbody'), ...rowsOf('tfoot')]
    const headRow = rowsOf('thead')[0] || (bodyRows[0] && !bodyRows[0].td ? bodyRows.shift() : null)
    const headers = headRow ? cellsOf(headRow).map(c => this.extractTextContent(c)) : []

    return {
      key: this.getContextualFriendlyName(parentKey) || 'Table',
      type: 'table',
      value: item.caption ? this.extractTextContent(item.caption) : undefined,
      children: bodyRows.map((row, rowIndex) => ({
        key: `Row ${rowIndex + 1}`,
        type: 'tableRow',
        children: cellsOf(row).map((cell, cellIndex) => {
          const text = this.extractTextContent(cell)
          return { key: headers[cellIndex] || `Column ${cellIndex + 1}`, value: text, type: this.getDataType(text), children: [] }
        })
      }))
    }
  }

  // '#text' already holds the in-order text of mixed content; otherwise join the descendants' text
  extractTextContent(element) {
    if (element === null || element === undefined) return ''
    if (typeof element !== 'object') return String(element).trim()
    if (Array.isArray(element)) return element.map(e => this.extractTextContent(e)).filter(Boolean).join(' ')
    if (element['#text']) return element['#text'].trim()
    return Object.entries(element)
      .filter(([key]) => key !== '@attributes')
      .map(([, value]) => this.extractTextContent(value))
      .filter(Boolean)
      .join(' ')
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