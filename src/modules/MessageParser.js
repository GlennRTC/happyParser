import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { HL7_SEGMENT_FIELDS, HL7_DATATYPE_COMPONENTS } from './hl7v2Definitions.js'

const HL7_HEADERS = new Set(['MSH', 'FHS', 'BHS'])
const MAX_INPUT = 10 * 1024 * 1024 // 10MB: DoS guard for XML/JSON
// preserveOrder keeps text and child elements in document order, so mixed narrative reads correctly
const xmlParser = new XMLParser({
  ignoreAttributes: false, attributeNamePrefix: '', preserveOrder: true, trimValues: false,
  parseTagValue: false, parseAttributeValue: false
})
const xmlFlatText = nodes => nodes.map(n => '#text' in n ? n['#text'] : xmlFlatText(n[Object.keys(n).find(k => k !== ':@')] || [])).join('')

// Ordered nodes → { tag: child | child[], '@attributes': {…}, '#text': in-order text of mixed/leaf elements }
const xmlToTree = nodes => {
  const obj = {}
  for (const n of nodes) {
    if ('#text' in n) continue
    const tag = Object.keys(n).find(k => k !== ':@')
    const child = xmlToTree(n[tag] || [])
    if (n[':@']) child['@attributes'] = n[':@']
    obj[tag] = tag in obj ? [...[obj[tag]].flat(), child] : child
  }
  const hasText = nodes.some(n => '#text' in n && /\S/.test(n['#text']))
  const hasChildren = nodes.some(n => !('#text' in n))
  if (hasText || !hasChildren) obj['#text'] = xmlFlatText(nodes).replace(/\s+/g, ' ').trim()
  return obj
}
const xmlText = n => (typeof n === 'object' ? n?.['#text'] : n) ?? ''

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
      'RGS': 'Resource Group',
      'NDS': 'Notification Detail'
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
      H: 'Header', P: 'Patient Information', O: 'Test Order', R: 'Result', C: 'Comment',
      Q: 'Request Information', M: 'Manufacturer Information', S: 'Scientific', L: 'Terminator'
    }

    // ASTM E1394 / CLSI LIS2-A2 field names; position 1 is the record type
    this.astmFields = {
      H: ['Record Type ID', 'Delimiter Definition', 'Message Control ID', 'Access Password', 'Sender Name or ID',
        'Sender Street Address', 'Reserved Field', 'Sender Telephone Number', 'Characteristics of Sender', 'Receiver ID',
        'Comment or Special Instructions', 'Processing ID', 'Version Number', 'Date and Time of Message'],
      P: ['Record Type ID', 'Sequence Number', 'Practice Assigned Patient ID', 'Laboratory Assigned Patient ID',
        'Patient ID No. 3', 'Patient Name', 'Mother\'s Maiden Name', 'Birthdate', 'Patient Sex',
        'Patient Race-Ethnic Origin', 'Patient Address', 'Reserved Field', 'Patient Telephone Number',
        'Attending Physician ID', 'Special Field 1', 'Special Field 2', 'Patient Height', 'Patient Weight',
        'Patient\'s Known or Suspected Diagnosis', 'Patient Active Medications', 'Patient\'s Diet', 'Practice Field No. 1',
        'Practice Field No. 2', 'Admission and Discharge Dates', 'Admission Status', 'Location',
        'Nature of Alternative Diagnostic Code and Classifiers', 'Alternative Diagnostic Code and Classification',
        'Patient Religion', 'Marital Status', 'Isolation Status', 'Language', 'Hospital Service', 'Hospital Institution',
        'Dosage Category'],
      O: ['Record Type ID', 'Sequence Number', 'Specimen ID', 'Instrument Specimen ID', 'Universal Test ID', 'Priority',
        'Requested/Ordered Date and Time', 'Specimen Collection Date and Time', 'Collection End Time',
        'Collection Volume', 'Collector ID', 'Action Code', 'Danger Code', 'Relevant Clinical Information',
        'Date/Time Specimen Received', 'Specimen Descriptor', 'Ordering Physician', 'Physician\'s Telephone Number',
        'User Field No. 1', 'User Field No. 2', 'Laboratory Field No. 1', 'Laboratory Field No. 2',
        'Date/Time Results Reported or Last Modified', 'Instrument Charge to Information System',
        'Instrument Section ID', 'Report Types', 'Reserved Field', 'Location of Specimen Collection',
        'Nosocomial Infection Flag', 'Specimen Service', 'Specimen Institution'],
      R: ['Record Type ID', 'Sequence Number', 'Universal Test ID', 'Data or Measurement Value', 'Units',
        'Reference Ranges', 'Result Abnormal Flags', 'Nature of Abnormality Testing', 'Result Status',
        'Date of Change in Instrument Normative Values', 'Operator Identification', 'Date/Time Test Started',
        'Date/Time Test Completed', 'Instrument Identification'],
      C: ['Record Type ID', 'Sequence Number', 'Comment Source', 'Comment Text', 'Comment Type'],
      Q: ['Record Type ID', 'Sequence Number', 'Starting Range ID Number', 'Ending Range ID Number', 'Universal Test ID',
        'Nature of Request Time Limits', 'Beginning Request Results Date and Time', 'Ending Request Results Date and Time',
        'Requesting Physician Name', 'Requesting Physician Telephone Number', 'User Field No. 1', 'User Field No. 2',
        'Request Information Status Codes'],
      M: ['Record Type ID', 'Sequence Number'],
      S: ['Record Type ID', 'Sequence Number'],
      L: ['Record Type ID', 'Sequence Number', 'Termination Code']
    }
    this.astmComponents = {
      'Universal Test ID': ['Universal Test ID Number', 'Universal Test ID Name', 'Universal Test ID Type',
        'Manufacturer\'s or Local Code'],
      'Patient Name': ['Last Name', 'First Name', 'Middle Name', 'Suffix', 'Title'],
      'Mother\'s Maiden Name': ['Last Name', 'First Name', 'Middle Name', 'Suffix', 'Title']
    }
  }

  parse(message, format) {
    const parsers = { hl7v2: this.parseHL7v2, hl7v3: this.parseHL7v3, fhir: this.parseFHIR, astm: this.parseASTM, json: this.parseJSON, xml: this.parseXML }
    if (!parsers[format]) throw new Error(`Unsupported format: ${format}`)
    try {
      return parsers[format].call(this, message)
    } catch (error) {
      throw new Error(`Failed to parse ${format} message: ${error.message}`)
    }
  }

  parseHL7v2(message) {
    const lines = message.split(/\r\n|\r|\n/).map(l => l.replace(/[\x0b\x1c]/g, '').trim()).filter(Boolean)
    const header = lines.find(l => HL7_HEADERS.has(l.slice(0, 3)))
    if (!header || !lines.some(l => l.startsWith('MSH'))) throw new Error('No MSH segment found')
    const fs = header[3]
    const enc = header.slice(4).split(fs)[0]
    const d = { field: fs, component: enc[0] || '^', repetition: enc[1] || '~', escape: enc[2] || '\\', subcomponent: enc[3] || '&' }

    const counts = {}
    const segments = lines.map(line => {
      const type = line.slice(0, 3)
      const parts = line.split(fs)
      const values = HL7_HEADERS.has(type) ? [fs, ...parts.slice(1)] : parts.slice(1)
      const defs = HL7_SEGMENT_FIELDS[type] || []
      counts[type] = (counts[type] || 0) + 1
      return {
        type,
        index: counts[type],
        name: this.hl7Segments[type] || type,
        raw: line,
        fields: values.map((value, i) => {
          const [name, dataType] = [defs[i]].flat()
          return { name: name || `${type}-${i + 1}`, value, position: i + 1, dataType }
        })
      }
    })

    const detailedStructure = Object.fromEntries(segments.map(seg => [
      `${seg.type}${counts[seg.type] > 1 ? ' #' + seg.index : ''} - ${seg.name}`,
      Object.fromEntries(seg.fields.filter(f => f.value !== '').map(f => {
        const label = `${seg.type}-${f.position}`
        const key = f.name === label ? label : `${label} ${f.name}`
        const isEncoding = HL7_HEADERS.has(seg.type) && f.position <= 2
        return [key, isEncoding ? f.value : this.fieldTree(f.value, d, label, HL7_DATATYPE_COMPONENTS[f.dataType])]
      }))
    ]))

    const pidName = segments.find(s => s.type === 'PID')?.fields[4]?.value || ''
    const [family = '', given = ''] = pidName.split(d.repetition)[0].split(d.component).map(v => this.decodeEscapes(v, d))
    const patientName = [given, family].filter(Boolean).join(' ') || null

    const msh = segments.find(s => s.type === 'MSH').fields
    const [code = '', event = ''] = (msh[8]?.value || '').split(d.component)
    const version = (msh[11]?.value || '').split(d.component)[0]

    return {
      format: 'hl7v2',
      version,
      formatted: segments.map(s => s.raw).join('\n'),
      analysis: {
        messageType: `${code}${event ? '^' + event : ''} - ${this.hl7MessageTypes[code] || 'Unknown'}`,
        segments: segments.map(seg => ({ name: `${seg.type} - ${seg.name}`, type: seg.type, index: seg.index, fields: seg.fields })),
        segmentCount: segments.length,
        version,
        patientName,
        detailedStructure
      }
    }
  }

  // HL7 (\F\ \S\ \T\ \R\ \E\ \.br\ \.sp\ \H\ \N\ \Xhh\) and ASTM (&F& &S& &R& &E&) escape sequences
  decodeEscapes(value, d) {
    if (!value.includes(d.escape)) return value
    const e = d.escape.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const map = { F: d.field, S: d.component, T: d.subcomponent, R: d.repetition, E: d.escape }
    return value.replace(new RegExp(`${e}([^${e}]*)${e}`, 'g'), (match, code) =>
      map[code] ?? (/^\.(br|sp)/.test(code) ? '\n'
        : /^X([0-9A-Fa-f]{2})+$/.test(code) ? String.fromCharCode(...code.slice(1).match(/../g).map(h => parseInt(h, 16)))
        // highlight on/off, other formatting commands (.in .ti .sk .ce .fi .nf) and locally defined \Z..\ carry no text
        : /^([HN]|\..*|Z.*)$/.test(code) ? ''
        : match))
  }

  // One field → decoded string, or { 'PID-5.1 Family Name': … } for components, or an array for repetitions
  fieldTree(raw, d, label, compNames = []) {
    const sub = (value, subLabel) => {
      const parts = d.subcomponent ? value.split(d.subcomponent) : [value]
      if (parts.length === 1) return this.decodeEscapes(value, d)
      return Object.fromEntries(parts.map((s, i) => [`${subLabel}.${i + 1}`, this.decodeEscapes(s, d)]).filter(([, v]) => v !== ''))
    }
    const reps = raw.split(d.repetition).map(rep => {
      const comps = rep.split(d.component)
      if (comps.length === 1) return sub(rep, `${label}.1`)
      return Object.fromEntries(comps
        .map((c, i) => [`${label}.${i + 1}${compNames[i] ? ' ' + compNames[i] : ''}`, sub(c, `${label}.${i + 1}`)])
        .filter(([, v]) => v !== ''))
    })
    return reps.length === 1 ? reps[0] : reps
  }

  parseXmlDocument(message) {
    if (message.length > MAX_INPUT) throw new Error('Message too large (max 10MB)')
    const valid = XMLValidator.validate(message)
    if (valid !== true) throw new Error(`Invalid XML: ${valid.err.msg} (line ${valid.err.line})`)
    const doc = xmlToTree(xmlParser.parse(message))
    const rootName = Object.keys(doc).find(k => !k.startsWith('?'))
    return { rootName, root: doc[rootName] }
  }

  parseHL7v3(message) {
    const { rootName, root } = this.parseXmlDocument(message)
    const attr = (node, a) => [node].flat()[0]?.['@attributes']?.[a]
    const templateIds = [root.templateId].flat().map(t => attr(t, 'root')).filter(Boolean)
    const isCda = rootName.endsWith('ClinicalDocument')
    // ponytail: paths assume the default CDA namespace (no "cda:" prefixes); prefixed docs still parse, only the summary is empty
    const name = [[root.recordTarget].flat()[0]?.patientRole?.patient?.name].flat()[0]
    return {
      format: 'hl7v3',
      version: !isCda ? 'V3 Messaging' : templateIds.some(t => t.startsWith('2.16.840.1.113883.10.20.22')) ? 'C-CDA' : 'CDA R2',
      formatted: this.formatXML(message),
      analysis: {
        documentType: xmlText(root.title) || rootName,
        templateId: templateIds.join(', '),
        code: attr(root.code, 'code') || '',
        patientName: name ? [...[name.given].flat().map(xmlText), xmlText(name.family)].filter(Boolean).join(' ') : null,
        sectionCount: [root.component?.structuredBody?.component].flat().filter(Boolean).length,
        detailedStructure: root,
        elementCount: this.countXmlElements(message)
      }
    }
  }

  parseFHIR(message) {
    if (message.length > MAX_INPUT) throw new Error('Message too large (max 10MB)')
    const isXML = message.trim().startsWith('<')
    let resource
    if (isXML) {
      const { rootName, root } = this.parseXmlDocument(message)
      resource = { resourceType: rootName, ...this.fhirXmlToJson(root) }
    } else {
      resource = JSON.parse(message)
    }
    const resourceType = resource.resourceType || 'Unknown'
    const analysis = {
      resourceType,
      description: this.fhirResourceTypes[resourceType] || 'Unknown resource type',
      detailedStructure: resource,
      fieldCount: Object.keys(resource).length,
      patientName: this.fhirPatient(resource)
    }
    if (resourceType === 'Bundle') {
      const entries = [resource.entry].flat().filter(Boolean)
      resource.entry = entries
      analysis.bundleType = resource.type || null
      analysis.entryCount = entries.length
      analysis.resourceCounts = {}
      for (const e of entries) {
        const t = e.resource?.resourceType || 'Unknown'
        analysis.resourceCounts[t] = (analysis.resourceCounts[t] || 0) + 1
      }
      analysis.patientName = this.fhirPatient(entries.find(e => e.resource?.resourceType === 'Patient')?.resource || {})
    }
    return {
      format: 'fhir',
      version: this.extractFHIRVersion(message),
      formatted: isXML ? this.formatXML(message) : JSON.stringify(resource, null, 2),
      analysis
    }
  }

  // ponytail: no StructureDefinition cardinality, so an XML element that occurs once stays an object (JSON would use an array)
  fhirXmlToJson(node) {
    if (Array.isArray(node)) return node.map(n => this.fhirXmlToJson(n))
    if (typeof node !== 'object' || node === null) return node
    const { '@attributes': { xmlns, value, ...attrs } = {}, '#text': text, ...children } = node
    const kids = Object.fromEntries(Object.entries(children).map(([k, v]) => {
      const converted = this.fhirXmlToJson(v)
      // <resource><Patient>…</Patient></resource> → resource: { resourceType: 'Patient', … }
      if ((k === 'resource' || k === 'contained') && !Array.isArray(v) && Object.keys(children[k]).length === 1) {
        const [type] = Object.keys(v)
        return [k, { resourceType: type, ...converted[type] }]
      }
      return [k, converted]
    }))
    if (value !== undefined && !Object.keys(kids).length && !Object.keys(attrs).length) return value
    return { ...attrs, ...(value !== undefined && { value }), ...kids, ...(text && { '#text': text }) }
  }

  fhirPatient(r) {
    if (r.resourceType === 'Patient') {
      const n = [r.name].flat()[0]
      return n ? (n.text || [...[n.given].flat(), n.family].filter(Boolean).join(' ')) || null : null
    }
    return r.subject?.display || r.subject?.reference || r.patient?.display || r.patient?.reference || null
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

  // ponytail: E1381 link-layer is only unwrapped (STX/FN/ETB/ETX/checksum); checksums are not verified
  unframeASTM(message) {
    if (message.includes('\x02')) {
      let text = ''
      for (const [, body, end] of message.matchAll(/\x02[0-7]([\s\S]*?)([\x03\x17])[0-9A-Fa-f]{2}/g)) {
        text += body + (end === '\x03' ? '\r' : '')
      }
      message = text
    }
    return message.split(/\r\n|\r|\n/)
      .map(l => l.replace(/[\x04\x05\x06\x15]/g, '').trim().replace(/^\d+(?=[A-Z][^A-Za-z0-9\s])/, ''))
      .filter(l => /^[A-Z][^A-Za-z0-9\s]/.test(l))
  }

  parseASTM(message) {
    const lines = this.unframeASTM(message)
    const header = lines.find(l => l[0] === 'H')
    const fs = header?.[1] || '|'
    const delims = header ? header.slice(2).split(fs)[0] : ''
    const d = { field: fs, repetition: delims[0] || '\\', component: delims[1] || '^', escape: delims[2] || '&' }

    const counts = {}
    const records = lines.filter(l => l[1] === fs).map(line => {
      const type = line[0]
      const defs = this.astmFields[type] || []
      counts[type] = (counts[type] || 0) + 1
      const fields = line.split(fs).map((value, i) => ({ name: defs[i] || `${type}-${i + 1}`, value, position: i + 1 }))
      return { type, index: counts[type], sequence: fields[1]?.value || '', name: this.astmRecordTypes[type] || type, fields, raw: line }
    })
    if (!records.length) throw new Error('No ASTM records found')

    const detailedStructure = Object.fromEntries(records.map(rec => [
      `${rec.type} #${rec.index} - ${rec.name}`,
      Object.fromEntries(rec.fields.filter(f => f.value !== '').map(f => {
        const label = `${rec.type}-${f.position}`
        const key = f.name === label ? label : `${label} ${f.name}`
        const isDelims = rec.type === 'H' && f.position === 2
        return [key, isDelims ? f.value : this.fieldTree(f.value, d, label, this.astmComponents[f.name])]
      }))
    ]))

    const pName = records.find(r => r.type === 'P')?.fields[5]?.value || ''
    const [last = '', first = ''] = pName.split(d.repetition)[0].split(d.component).map(v => this.decodeEscapes(v, d))
    const hFields = records.find(r => r.type === 'H')?.fields || []

    return {
      format: 'astm',
      version: hFields[12]?.value || message.match(/LIS2-A2|E1394|E1381|E1238/)?.[0] || null,
      formatted: records.map(r => r.raw).join('\n'),
      analysis: {
        recordTypes: [...new Set(records.map(r => r.type))],
        recordCount: records.length,
        records: records.map(r => ({ name: `${r.type} - ${r.name}`, type: r.type, sequence: r.sequence, fields: r.fields })),
        patientName: [first, last].filter(Boolean).join(' ') || null,
        detailedStructure
      }
    }
  }

  parseJSON(message) {
    if (message.length > MAX_INPUT) throw new Error('Message too large (max 10MB)')
    const parsed = JSON.parse(message)
    return {
      format: 'json',
      version: null,
      formatted: JSON.stringify(parsed, null, 2),
      analysis: {
        type: Array.isArray(parsed) ? 'Array' : 'Object',
        structure: this.analyzeJSONStructure(parsed),
        detailedStructure: parsed,
        size: message.length,
        depth: this.calculateJSONDepth(parsed)
      }
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
    
    return structure.slice(0, 100) // Increased limit for complex data
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
    const { rootName, root } = this.parseXmlDocument(message)
    return {
      format: 'xml',
      version: this.extractXMLVersion(message),
      formatted: this.formatXML(message),
      analysis: {
        rootElement: rootName,
        structure: this.analyzeXMLStructure(root),
        detailedStructure: root,
        elementCount: this.countXmlElements(message),
        namespaces: Object.entries(root['@attributes'] || {}).filter(([k]) => k.startsWith('xmlns')).map(([k, v]) => `${k}="${v}"`)
      }
    }
  }

  analyzeXMLStructure(node) {
    return Object.entries(node).filter(([k]) => k !== '@attributes' && k !== '#text').flatMap(([name, value]) =>
      [value].flat().map(child => ({
        name,
        attributes: Object.entries(child['@attributes'] || {}).map(([a, v]) => `${a}="${v}"`),
        hasChildren: Object.keys(child).some(k => k !== '@attributes' && k !== '#text'),
        textContent: xmlText(child).slice(0, 100)
      })))
  }

  // ponytail: counts start tags with a regex; "<x" inside CDATA or comments is miscounted
  countXmlElements(message) {
    return (message.match(/<[A-Za-z_]/g) || []).length
  }

  formatXML(xml) {
    return xml.replace(/>\s*</g, '>\n<').trim()
  }

  extractXMLVersion(message) {
    const versionMatch = message.match(/<\?xml[^>]+version\s*=\s*["']([^"']+)["']/i)
    return versionMatch ? versionMatch[1] : null
  }
}
