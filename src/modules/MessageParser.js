export class MessageParser {
  constructor() {
    this.hl7MessageTypes = {
      'ACK': 'General acknowledgment',
      'ADR': 'ADT response',
      'ADT': 'Admission, discharge, transfer',
      'BAR': 'Add/change billing account',
      'DFT': 'Detailed financial transaction',
      'DOC': 'Document response',
      'DSR': 'Display response',
      'EAC': 'Automated equipment command',
      'EAN': 'Automated equipment notification',
      'EAR': 'Automated equipment response',
      'EDR': 'Enhanced display response',
      'EQQ': 'Embedded query language query',
      'ERP': 'Event replay response',
      'ESR': 'Automated equipment status update acknowledgment',
      'ESU': 'Automated equipment status update',
      'INR': 'Automated equipment inventory request',
      'INU': 'Automated equipment inventory update',
      'LSR': 'Automated equipment log/service request',
      'LSU': 'Automated equipment log/service update',
      'MCF': 'Delayed acknowledgment',
      'MDM': 'Medical document management',
      'MFD': 'Master files delayed application acknowledgment',
      'MFK': 'Master files application acknowledgment',
      'MFN': 'Master files notification',
      'MFQ': 'Master files query',
      'MFR': 'Master files response',
      'NMD': 'Application management data message',
      'NMQ': 'Application management query message',
      'NMR': 'Application management response message',
      'OMD': 'Dietary order',
      'OMG': 'General clinical order',
      'OMI': 'Imaging order',
      'OML': 'Laboratory order',
      'OMN': 'Non-stock requisition order',
      'OMP': 'Pharmacy/treatment order',
      'OMS': 'Stock requisition order',
      'OMT': 'Pharmacy/treatment order',
      'OPL': 'Population/location-based laboratory order',
      'OPR': 'Population/location-based laboratory order acknowledgment',
      'OPU': 'Unsolicited population/location-based laboratory observation',
      'ORA': 'Observation report acknowledgment',
      'ORD': 'Dietary order acknowledgment',
      'ORF': 'Query for results of observation',
      'ORG': 'General clinical order acknowledgment',
      'ORI': 'Imaging order acknowledgment',
      'ORL': 'Laboratory acknowledgment',
      'ORM': 'Order message',
      'ORN': 'Non-stock requisition - General order acknowledgment',
      'ORP': 'Pharmacy/treatment order acknowledgment',
      'ORR': 'General order response message response to any ORM',
      'ORS': 'Stock requisition - Order acknowledgment',
      'ORT': 'Pharmacy/treatment order acknowledgment',
      'ORU': 'Unsolicited transmission of an observation message',
      'OUL': 'Unsolicited laboratory observation',
      'PEX': 'Unsolicited personnel/equipment status update',
      'PGL': 'Patient goal message',
      'PIN': 'Patient insurance information',
      'PMU': 'Add personnel record',
      'PPG': 'Patient pathway message (goal-oriented)',
      'PPP': 'Patient pathway message (problem-oriented)',
      'PPR': 'Patient problem message',
      'PPT': 'Patient pathway goal-oriented response',
      'PPV': 'Patient goal response',
      'PRR': 'Patient problem response',
      'PTR': 'Patient pathway problem-oriented response',
      'QBP': 'Query by parameter',
      'QCK': 'Query general acknowledgment',
      'QCN': 'Cancel query',
      'QRY': 'Query, original mode',
      'QSB': 'Create subscription',
      'QSX': 'Cancel subscription/acknowledge message',
      'QVR': 'Query for previous events',
      'RAR': 'Pharmacy/treatment administration acknowledgment',
      'RAS': 'Pharmacy/treatment administration',
      'RCI': 'Return clinical information',
      'RCL': 'Return clinical list',
      'RDE': 'Pharmacy/treatment encoded order',
      'RDR': 'Pharmacy/treatment dispense acknowledgment',
      'RDS': 'Pharmacy/treatment dispense',
      'RDY': 'Display based response',
      'REF': 'Patient referral',
      'RER': 'Pharmacy/treatment encoded order acknowledgment',
      'RGR': 'Pharmacy/treatment dose acknowledgment',
      'RGV': 'Pharmacy/treatment give',
      'ROR': 'Pharmacy/treatment order response',
      'RPA': 'Return patient authorization',
      'RPI': 'Return patient information',
      'RPL': 'Return patient display list',
      'RPR': 'Return patient list',
      'RQA': 'Request patient authorization',
      'RQC': 'Request clinical information',
      'RQI': 'Request patient information',
      'RQP': 'Request patient demographics',
      'RRA': 'Pharmacy/treatment administration acknowledgment',
      'RRD': 'Return patient display data',
      'RRE': 'Pharmacy/treatment encoded order acknowledgment',
      'RRG': 'Pharmacy/treatment give acknowledgment',
      'RRI': 'Return referral information',
      'RSP': 'Segment pattern response',
      'RTB': 'Tabular response',
      'SIU': 'Schedule information unsolicited',
      'SPQ': 'Stored procedure request',
      'SQM': 'Schedule query message',
      'SQR': 'Schedule query response',
      'SRM': 'Schedule request message',
      'SRR': 'Scheduled request response',
      'SSR': 'Specimen status request message',
      'SSU': 'Specimen status update message',
      'SUR': 'Summary product experience report',
      'TBR': 'Tabular data response',
      'TCR': 'Automated equipment test code settings request',
      'TCU': 'Automated equipment test code settings update',
      'UDM': 'Unsolicited display update message',
      'VXQ': 'Query for vaccination record',
      'VXR': 'Vaccination record response',
      'VXU': 'Unsolicited vaccination record update',
      'VXX': 'Response for vaccination query with multiple PID matches'
    }

    this.hl7Segments = {
      'MSH': 'Message Header',
      'SFT': 'Software Segment',
      'UAC': 'User Authentication Credential',
      'EVN': 'Event Type',
      'PID': 'Patient Identification',
      'PD1': 'Patient Additional Demographics',
      'ARV': 'Access Restriction',
      'ROL': 'Role',
      'NK1': 'Next of Kin / Associated Parties',
      'PV1': 'Patient Visit',
      'PV2': 'Patient Visit - Additional Information',
      'DB1': 'Disability',
      'OBX': 'Observation/Result',
      'AL1': 'Patient Allergy Information',
      'DG1': 'Diagnosis',
      'DRG': 'Diagnosis Related Group',
      'PR1': 'Procedures',
      'GT1': 'Guarantor',
      'IN1': 'Insurance',
      'IN2': 'Insurance Additional Information',
      'IN3': 'Insurance Additional Information, Certification',
      'ACC': 'Accident',
      'UB1': 'UB82',
      'UB2': 'UB92 Data',
      'PDA': 'Patient Death and Autopsy',
      'ORC': 'Common Order',
      'OBR': 'Observation Request',
      'NTE': 'Notes and Comments',
      'CTI': 'Clinical Trial Identification',
      'FT1': 'Financial Transaction',
      'CTD': 'Contact Data',
      'PRD': 'Provider Data',
      'PRT': 'Participation Information',
      'TXA': 'Transcription Document Header',
      'CON': 'Consent Segment',
      'MSA': 'Message Acknowledgment',
      'ERR': 'Error',
      'QAK': 'Query Acknowledgment',
      'QPD': 'Query Parameter Definition',
      'QRI': 'Query Response Instance',
      'DSC': 'Continuation Pointer',
      'QRD': 'Original-Style Query Definition',
      'QRF': 'Original-Style Query Filter',
      'RCP': 'Response Control Parameter',
      'SPM': 'Specimen',
      'SAC': 'Specimen and Container Detail',
      'OBX': 'Observation/Result',
      'TCD': 'Test Code Detail',
      'SID': 'Substance Identifier',
      'TCC': 'Test Code Configuration',
      'RXO': 'Pharmacy/Treatment Order',
      'RXR': 'Pharmacy/Treatment Route',
      'RXC': 'Pharmacy/Treatment Component Order',
      'RXE': 'Pharmacy/Treatment Encoded Order',
      'RXD': 'Pharmacy/Treatment Dispense',
      'RXG': 'Pharmacy/Treatment Give',
      'RXA': 'Pharmacy/Treatment Administration',
      'BPO': 'Blood Product Order',
      'BPX': 'Blood Product Dispense Status',
      'BTX': 'Blood Product Transfusion/Disposition',
      'SCH': 'Scheduling Activity Information',
      'AIG': 'Appointment Information - General Resource',
      'AIL': 'Appointment Information - Location Resource',
      'AIP': 'Appointment Information - Personnel Resource',
      'AIS': 'Appointment Information - Service',
      'APR': 'Appointment Preferences',
      'PID': 'Patient Identification',
      'PV1': 'Patient Visit',
      'RGS': 'Resource Group',
      'AIG': 'Appointment Information - General Resource',
      'AIL': 'Appointment Information - Location Resource',
      'AIP': 'Appointment Information - Personnel Resource',
      'AIS': 'Appointment Information - Service',
      'NDS': 'Notification Detail',
      'NTE': 'Notes and Comments'
    }

    this.fhirResourceTypes = {
      'Patient': 'Demographics and other administrative information about an individual',
      'Observation': 'Measurements and simple assertions made about a patient',
      'Condition': 'A clinical condition, problem, diagnosis, or other event',
      'Procedure': 'An action that is or was performed on a patient',
      'MedicationRequest': 'An order or request for medication',
      'DiagnosticReport': 'The findings and interpretation of diagnostic tests',
      'Encounter': 'An interaction between a patient and healthcare provider',
      'Organization': 'A formally or informally recognized grouping of people',
      'Practitioner': 'A person who is directly or indirectly involved in healthcare',
      'Location': 'Details and position information for a physical place',
      'AllergyIntolerance': 'Risk of harmful or undesirable physiological response',
      'Immunization': 'Describes the event of a patient being administered a vaccine',
      'Bundle': 'A container for a collection of resources',
      'OperationOutcome': 'Information about the success/failure of an action',
      'MedicationStatement': 'A record of a medication that is being consumed by a patient',
      'Goal': 'Describes the intended objective(s) for a patient',
      'CarePlan': 'Describes the intention of how one or more practitioners intend to deliver care',
      'CareTeam': 'The Care Team includes all the people and organizations who plan to participate',
      'Device': 'A type of a manufactured item that is used in healthcare',
      'DeviceRequest': 'Represents a request for a patient to employ a medical device',
      'DeviceUseStatement': 'A record of a device being used by a patient',
      'Flag': 'Prospective warnings of potential issues when providing care to the patient',
      'List': 'A collection of resources',
      'Composition': 'A set of healthcare-related information that is assembled together',
      'DocumentReference': 'A reference to a document',
      'Media': 'A photo, video, or audio recording acquired or used in healthcare',
      'Specimen': 'A sample to be used for analysis',
      'BodyStructure': 'Record details about an anatomical structure',
      'Substance': 'A homogeneous material with definite composition',
      'Task': 'A task to be performed',
      'Appointment': 'A booking of a healthcare event among patient(s), practitioner(s), related person(s) and/or device(s)',
      'AppointmentResponse': 'A reply to an appointment request for a patient and/or practitioner(s)',
      'Schedule': 'A container for slots of time that may be available for booking appointments',
      'Slot': 'A slot of time on a schedule that may be available for booking appointments',
      'HealthcareService': 'The details of a healthcare service available at a location',
      'Coverage': 'Financial instrument which may be used to reimburse or pay for health care products and services',
      'Claim': 'A provider issued list of professional services and products',
      'ClaimResponse': 'Remittance resource',
      'PaymentNotice': 'This resource provides the status of the payment for goods and services rendered',
      'PaymentReconciliation': 'This resource provides the details including amount of a payment'
    }

    this.astmRecordTypes = {
      'H': 'Header Record - Contains sender and receiver information',
      'P': 'Patient Information Record - Contains patient demographics',
      'O': 'Test Order Record - Contains test order information',
      'R': 'Result Record - Contains test results',
      'C': 'Comment Record - Contains comments',
      'M': 'Manufacturer Information Record - Contains manufacturer info',
      'S': 'Scientific Record - Contains scientific data',
      'L': 'Terminator Record - Indicates end of transmission'
    }
  }

  parse(message, format) {
    try {
      switch (format) {
        case 'hl7v2':
          return this.parseHL7v2(message)
        case 'hl7v3':
          return this.parseHL7v3(message)
        case 'fhir':
          return this.parseFHIR(message)
        case 'astm':
          return this.parseASTM(message)
        case 'json':
          return this.parseJSON(message)
        case 'xml':
          return this.parseXML(message)
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format} message: ${error.message}`)
    }
  }

  parseHL7v2(message) {
    const lines = message.split(/\r?\n/).filter(line => line.trim())
    const segments = []
    let messageType = ''
    let version = ''

    for (const line of lines) {
      const segmentType = line.substring(0, 3)
      const fields = line.split('|')
      
      if (segmentType === 'MSH') {
        messageType = fields[8] ? fields[8].split('^')[0] : ''
        version = fields[11] || ''
      }

      const segment = {
        type: segmentType,
        name: this.hl7Segments[segmentType] || segmentType,
        fields: this.parseHL7Fields(fields, segmentType),
        raw: line
      }

      segments.push(segment)
    }

    return {
      format: 'hl7v2',
      version: version,
      formatted: this.formatHL7v2(segments),
      analysis: {
        messageType: `${messageType} - ${this.hl7MessageTypes[messageType] || 'Unknown'}`,
        segments: segments.map(seg => ({
          name: `${seg.type} - ${seg.name}`,
          fields: seg.fields.filter(f => f.value).slice(0, 10)
        })),
        segmentCount: segments.length,
        version: version
      }
    }
  }

  parseHL7Fields(fields, segmentType) {
    const fieldDefinitions = {
      'MSH': [
        'Field Separator', 'Encoding Characters', 'Sending Application', 'Sending Facility',
        'Receiving Application', 'Receiving Facility', 'Date/Time of Message', 'Security',
        'Message Type', 'Message Control ID', 'Processing ID', 'Version ID'
      ],
      'PID': [
        'Set ID', 'Patient ID', 'Patient Identifier List', 'Alternate Patient ID',
        'Patient Name', 'Mother\'s Maiden Name', 'Date/Time of Birth', 'Administrative Sex',
        'Patient Alias', 'Race', 'Patient Address', 'County Code', 'Phone Number - Home',
        'Phone Number - Business', 'Primary Language'
      ],
      'OBX': [
        'Set ID', 'Value Type', 'Observation Identifier', 'Observation Sub-ID',
        'Observation Value', 'Units', 'References Range', 'Abnormal Flags',
        'Probability', 'Nature of Abnormal Test', 'Observation Result Status', 'Effective Date'
      ],
      'OBR': [
        'Set ID', 'Placer Order Number', 'Filler Order Number', 'Universal Service Identifier',
        'Priority', 'Requested Date/Time', 'Observation Date/Time', 'Observation End Date/Time',
        'Collection Volume', 'Collector Identifier', 'Specimen Action Code'
      ]
    }

    const definitions = fieldDefinitions[segmentType] || []
    const parsedFields = []

    for (let i = 1; i < fields.length; i++) {
      parsedFields.push({
        name: definitions[i - 1] || `${segmentType}.${i}`,
        value: fields[i] || '',
        position: i
      })
    }

    return parsedFields
  }

  formatHL7v2(segments) {
    return segments.map(segment => segment.raw).join('\n')
  }

  parseHL7v3(message) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(message, 'text/xml')
      
      if (doc.querySelector('parsererror')) {
        throw new Error('Invalid XML format')
      }

      const rootElement = doc.documentElement
      const formatted = this.formatXML(message)
      
      // Extract basic information
      const templateId = rootElement.getAttribute('templateId') || 
                        rootElement.querySelector('templateId')?.getAttribute('root') || ''
      const code = rootElement.getAttribute('code') || 
                   rootElement.querySelector('code')?.getAttribute('code') || ''
      
      return {
        format: 'hl7v3',
        version: 'CDA',
        formatted: formatted,
        analysis: {
          documentType: rootElement.tagName,
          templateId: templateId,
          code: code,
          structure: this.analyzeHL7v3Structure(rootElement),
          detailedStructure: this.xmlToObject(rootElement),
          elementCount: rootElement.querySelectorAll('*').length
        }
      }
    } catch (error) {
      throw new Error(`HL7 v3 parsing error: ${error.message}`)
    }
  }

  analyzeHL7v3Structure(element) {
    const structure = []
    const children = element.children
    
    for (const child of children) {
      const childInfo = {
        name: child.tagName,
        attributes: Array.from(child.attributes).map(attr => `${attr.name}="${attr.value}"`),
        hasChildren: child.children.length > 0,
        textContent: child.textContent && child.textContent.trim().length > 0 ? child.textContent.trim().substring(0, 100) : ''
      }
      structure.push(childInfo)
    }
    
    return structure.slice(0, 20) // Limit to first 20 elements
  }

  parseFHIR(message) {
    try {
      let parsed
      let isXML = false
      
      if (message.trim().startsWith('<')) {
        isXML = true
        const parser = new DOMParser()
        const doc = parser.parseFromString(message, 'text/xml')
        
        if (doc.querySelector('parsererror')) {
          throw new Error('Invalid XML format')
        }
        
        parsed = this.xmlToObject(doc.documentElement)
      } else {
        parsed = JSON.parse(message)
      }

      const resourceType = parsed.resourceType || parsed.name || 'Unknown'
      const formatted = isXML ? this.formatXML(message) : JSON.stringify(parsed, null, 2)
      
      return {
        format: 'fhir',
        version: this.extractFHIRVersion(message),
        formatted: formatted,
        analysis: {
          resourceType: resourceType,
          description: this.fhirResourceTypes[resourceType] || 'Unknown resource type',
          structure: this.analyzeFHIRStructure(parsed),
          detailedStructure: parsed,
          fieldCount: Object.keys(parsed).length
        }
      }
    } catch (error) {
      throw new Error(`FHIR parsing error: ${error.message}`)
    }
  }

  extractFHIRVersion(message) {
    const versionMatch = message.match(/"fhirVersion"\s*:\s*"([^"]+)"/i)
    if (versionMatch) {
      const version = versionMatch[1]
      if (version.startsWith('4.0')) return 'R4'
      if (version.startsWith('4.3')) return 'R4B'
      if (version.startsWith('5.0')) return 'R5'
      return version
    }
    return null
  }

  analyzeFHIRStructure(resource) {
    const structure = []
    
    for (const [key, value] of Object.entries(resource)) {
      if (key === 'resourceType') continue
      
      const field = {
        name: key,
        type: Array.isArray(value) ? 'array' : typeof value,
        value: this.formatFHIRValue(value)
      }
      
      structure.push(field)
    }
    
    return structure.slice(0, 20)
  }

  formatFHIRValue(value) {
    if (Array.isArray(value)) {
      return `Array(${value.length})`
    } else if (typeof value === 'object' && value !== null) {
      return `Object with ${Object.keys(value).length} properties`
    } else if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...'
    } else {
      return String(value)
    }
  }

  parseASTM(message) {
    const lines = message.split(/\r?\n/).filter(line => line.trim())
    const records = []
    
    for (const line of lines) {
      const cleaned = line.replace(/[\x02\x03\x04\x05\x06\x15\x17]/g, '')
      const match = cleaned.match(/^(\d+)([A-Z])\|(.*)/)
      
      if (match) {
        const [, sequence, recordType, data] = match
        const fields = data.split('|')
        
        const record = {
          sequence: sequence,
          type: recordType,
          name: this.astmRecordTypes[recordType] || recordType,
          fields: this.parseASTMFields(fields, recordType),
          raw: line
        }
        
        records.push(record)
      }
    }

    return {
      format: 'astm',
      version: this.detectASTMVersion(message),
      formatted: this.formatASTM(records),
      analysis: {
        recordTypes: [...new Set(records.map(r => r.type))],
        recordCount: records.length,
        records: records.map(rec => ({
          name: `${rec.type} - ${rec.name}`,
          fields: rec.fields.filter(f => f.value).slice(0, 10)
        }))
      }
    }
  }

  parseASTMFields(fields, recordType) {
    const fieldDefinitions = {
      'H': [
        'Delimiter Definition', 'Message Control ID', 'Access Password', 'Sender Name/ID',
        'Sender Address', 'Reserved', 'Sender Phone', 'Sender Characteristics',
        'Receiver ID', 'Comment', 'Processing ID', 'Version Number', 'Timestamp'
      ],
      'P': [
        'Practice Patient ID', 'Lab Patient ID', 'Patient ID 3', 'Patient Name',
        'Mother\'s Maiden Name', 'Birth Date', 'Patient Sex', 'Patient Race',
        'Patient Address', 'Reserved', 'Patient Phone', 'Attending Physician'
      ],
      'O': [
        'Specimen ID', 'Instrument Specimen ID', 'Universal Test ID', 'Priority',
        'Requested Date/Time', 'Collection Date/Time', 'Collection End Time',
        'Collection Volume', 'Collector ID', 'Action Code', 'Danger Code',
        'Relevant Clinical Info'
      ],
      'R': [
        'Universal Test ID', 'Data Value', 'Units', 'Reference Range',
        'Abnormal Flag', 'Nature of QC', 'Result Status', 'Date Changed',
        'Operator ID', 'Date/Time Started', 'Date/Time Completed', 'Instrument ID'
      ]
    }

    const definitions = fieldDefinitions[recordType] || []
    const parsedFields = []

    for (let i = 0; i < fields.length; i++) {
      parsedFields.push({
        name: definitions[i] || `${recordType} Field ${i + 1}`,
        value: fields[i] || '',
        position: i + 1
      })
    }

    return parsedFields
  }

  detectASTMVersion(message) {
    if (message.includes('E1381')) return 'E1381'
    if (message.includes('E1394')) return 'E1394'
    if (message.includes('E1238')) return 'E1238'
    return null
  }

  formatASTM(records) {
    return records.map(record => record.raw).join('\n')
  }

  parseJSON(message) {
    try {
      // Security: Limit message size to prevent DoS attacks
      if (message.length > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Message too large (max 10MB)')
      }
      
      const parsed = JSON.parse(message)
      
      // Format JSON with proper indentation
      const formatted = JSON.stringify(parsed, null, 2)
      
      return {
        format: 'json',
        version: null,
        formatted: formatted,
        analysis: {
          type: Array.isArray(parsed) ? 'Array' : 'Object',
          structure: this.analyzeJSONStructure(parsed),
          detailedStructure: parsed,
          size: message.length,
          depth: this.calculateJSONDepth(parsed)
        }
      }
    } catch (error) {
      throw new Error(`JSON parsing error: ${error.message}`)
    }
  }

  analyzeJSONStructure(data) {
    const structure = []
    
    if (Array.isArray(data)) {
      structure.push({
        name: 'Array',
        type: 'array',
        value: `${data.length} items`
      })
      
      if (data.length > 0) {
        structure.push({
          name: 'First Item Type',
          type: typeof data[0],
          value: Array.isArray(data[0]) ? 'array' : typeof data[0]
        })
      }
    } else if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        structure.push({
          name: key,
          type: Array.isArray(value) ? 'array' : typeof value,
          value: this.formatJSONValue(value)
        })
      }
    }
    
    return structure.slice(0, 20)
  }

  formatJSONValue(value) {
    if (Array.isArray(value)) {
      return `Array(${value.length})`
    } else if (typeof value === 'object' && value !== null) {
      return `Object with ${Object.keys(value).length} properties`
    } else if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...'
    } else {
      return String(value)
    }
  }

  calculateJSONDepth(obj, currentDepth = 0) {
    if (currentDepth > 100) return currentDepth // Prevent infinite recursion
    
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth
    }
    
    let maxDepth = currentDepth
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const depth = this.calculateJSONDepth(item, currentDepth + 1)
        maxDepth = Math.max(maxDepth, depth)
      }
    } else {
      for (const value of Object.values(obj)) {
        const depth = this.calculateJSONDepth(value, currentDepth + 1)
        maxDepth = Math.max(maxDepth, depth)
      }
    }
    
    return maxDepth
  }

  parseXML(message) {
    try {
      // Security: Limit message size to prevent DoS attacks
      if (message.length > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Message too large (max 10MB)')
      }
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(message, 'text/xml')
      
      if (doc.querySelector('parsererror')) {
        throw new Error('Invalid XML format')
      }

      const formatted = this.formatXML(message)
      const rootElement = doc.documentElement
      
      return {
        format: 'xml',
        version: this.extractXMLVersion(message),
        formatted: formatted,
        analysis: {
          rootElement: rootElement.tagName,
          structure: this.analyzeXMLStructure(rootElement),
          detailedStructure: this.xmlToObject(rootElement),
          elementCount: rootElement.querySelectorAll('*').length,
          namespaces: this.extractXMLNamespaces(rootElement)
        }
      }
    } catch (error) {
      throw new Error(`XML parsing error: ${error.message}`)
    }
  }

  extractXMLVersion(message) {
    const versionMatch = message.match(/<\?xml[^>]+version\s*=\s*["']([^"']+)["']/i)
    return versionMatch ? versionMatch[1] : null
  }

  analyzeXMLStructure(element) {
    const structure = []
    const children = element.children
    
    for (const child of children) {
      const childInfo = {
        name: child.tagName,
        attributes: Array.from(child.attributes).map(attr => `${attr.name}="${attr.value}"`),
        hasChildren: child.children.length > 0,
        textContent: child.textContent && child.textContent.trim().length > 0 ? child.textContent.trim().substring(0, 100) : ''
      }
      structure.push(childInfo)
    }
    
    return structure.slice(0, 20)
  }

  extractXMLNamespaces(element) {
    const namespaces = []
    
    for (const attr of element.attributes) {
      if (attr.name.startsWith('xmlns')) {
        namespaces.push(`${attr.name}="${attr.value}"`)
      }
    }
    
    return namespaces
  }

  formatXML(xml) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')
      
      if (doc.querySelector('parsererror')) {
        return xml // Return original if parsing fails
      }

      const serializer = new XMLSerializer()
      const formatted = serializer.serializeToString(doc)
      
      // Basic formatting
      return formatted
        .replace(/></g, '>\n<')
        .replace(/^\s*\n/gm, '')
    } catch (error) {
      return xml // Return original if formatting fails
    }
  }

  xmlToObject(element) {
    const obj = {}
    
    // Add attributes
    if (element.attributes.length > 0) {
      obj['@attributes'] = {}
      for (const attr of element.attributes) {
        obj['@attributes'][attr.name] = attr.value
      }
    }
    
    // Add text content
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
      obj['#text'] = element.textContent
    } else {
      // Add child elements
      for (const child of element.children) {
        const childObj = this.xmlToObject(child)
        if (obj[child.tagName]) {
          if (!Array.isArray(obj[child.tagName])) {
            obj[child.tagName] = [obj[child.tagName]]
          }
          obj[child.tagName].push(childObj)
        } else {
          obj[child.tagName] = childObj
        }
      }
    }
    
    return obj
  }
}