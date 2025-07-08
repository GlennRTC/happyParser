export class FormatDetector {
  constructor() {
    this.patterns = {
      hl7v2: [
        /^MSH\|/,
        /\|MSH\|/,
        /MSH\^~\\&/
      ],
      hl7v3: [
        /<ClinicalDocument[^>]*xmlns[^>]*hl7\.org/i,
        /<ClinicalDocument[^>]*xmlns[^>]*CDA/i,
        /<ClinicalDocument/i,
        /<ContinuityOfCareRecord/i
      ],
      fhir: [
        /"resourceType"\s*:\s*"(Patient|Observation|Bundle|Condition|Procedure|DiagnosticReport|Encounter|Organization|Practitioner|Location|AllergyIntolerance|Immunization|Medication|MedicationRequest|MedicationStatement|Goal|CarePlan|CareTeam|Device|DeviceRequest|DeviceUseStatement|PractitionerRole|RelatedPerson|HealthcareService|ServiceRequest|Appointment|AppointmentResponse|Schedule|Slot|Coverage|Claim|ClaimResponse|ExplanationOfBenefit|Contract|ImmunizationEvaluation|ImmunizationRecommendation|MeasureReport|QuestionnaireResponse|Task|Communication|CommunicationRequest|RequestGroup|Basic|Binary|DocumentReference|List|Library|Measure|PlanDefinition|ActivityDefinition|Questionnaire|OperationDefinition|SearchParameter|CompartmentDefinition|ImplementationGuide|CapabilityStatement|StructureDefinition|ValueSet|CodeSystem|ConceptMap|NamingSystem|TerminologyCapabilities|ProviderCredentials|InsurancePlan|SubstanceDefinition|RegulatedAuthorization|MedicinalProductDefinition|ClinicalUseDefinition|Evidence|EvidenceReport|EvidenceVariable|ResearchStudy|ResearchSubject|ActivityDefinition|EventDefinition|ChargeItemDefinition|Invoice|Account|PaymentNotice|PaymentReconciliation|AuditEvent|Consent|Provenance|Signature|DocumentManifest|SupplyDelivery|SupplyRequest|VisionPrescription|RiskAssessment|GuidanceResponse|DetectedIssue|Flag|AdverseEvent|AllergyIntolerance|Condition|Procedure|FamilyMemberHistory|ClinicalImpression|DiagnosticReport|Observation|ImagingStudy|Media|Specimen|BodyStructure|ImagingSelection|MolecularSequence|GenomicStudy|BiologicallyDerivedProduct|Substance|NutritionOrder|NutritionIntake|InventoryReport|InventoryItem|Transport|DeviceAssociation|DeviceDispense|DeviceUsage|MessageDefinition|MessageHeader|EventDefinition|SubscriptionTopic|Subscription|SubscriptionStatus|Parameters|Bundle|Binary|Resource)"/i,
        /<([^>]+\s+)?resourceType\s*=\s*["']?(Patient|Observation|Bundle|[^"'>\s]+)["']?/i,
        /<Bundle[^>]*xmlns[^>]*fhir/i,
        /<Patient[^>]*xmlns[^>]*fhir/i
      ],
      astm: [
        /^\d+H\|/,
        /^\d+P\|/,
        /^\d+O\|/,
        /^\d+R\|/,
        /^\d+L\|/,
        /\x02\d+[HPORL]\|/,
        /\\x02\d+[HPORL]\|/,
        /STX\d+[HPORL]\|/
      ],
      json: [
        /^\s*\{/,
        /^\s*\[/
      ],
      xml: [
        /^\s*<\?xml/i,
        /^\s*<[^>]+>/
      ]
    }

    this.versionPatterns = {
      hl7v2: [
        { pattern: /\|2\.1\|/, version: 'v2.1' },
        { pattern: /\|2\.2\|/, version: 'v2.2' },
        { pattern: /\|2\.3\|/, version: 'v2.3' },
        { pattern: /\|2\.4\|/, version: 'v2.4' },
        { pattern: /\|2\.5\|/, version: 'v2.5' },
        { pattern: /\|2\.6\|/, version: 'v2.6' },
        { pattern: /\|2\.7\|/, version: 'v2.7' },
        { pattern: /\|2\.8\|/, version: 'v2.8' },
        { pattern: /\|2\.9\|/, version: 'v2.9' }
      ],
      hl7v3: [
        { pattern: /CDA.*Release.*2/i, version: 'CDA R2' },
        { pattern: /CDA.*Release.*3/i, version: 'CDA R3' },
        { pattern: /xmlns.*CDA/i, version: 'CDA' }
      ],
      fhir: [
        { pattern: /"fhirVersion"\s*:\s*"([^"]+)"/i, version: 'FHIR $1' },
        { pattern: /"fhirVersion"\s*:\s*"4\.0\.[0-9]+"/i, version: 'FHIR R4' },
        { pattern: /"fhirVersion"\s*:\s*"4\.3\.[0-9]+"/i, version: 'FHIR R4B' },
        { pattern: /"fhirVersion"\s*:\s*"5\.0\.[0-9]+"/i, version: 'FHIR R5' },
        { pattern: /xmlns.*fhir/i, version: 'FHIR' }
      ],
      astm: [
        { pattern: /E1381/i, version: 'E1381' },
        { pattern: /E1394/i, version: 'E1394' },
        { pattern: /E1238/i, version: 'E1238' }
      ]
    }
  }

  detectFormat(message) {
    if (!message || typeof message !== 'string') {
      return null
    }

    const trimmedMessage = message.trim()
    
    // Check each format
    for (const [format, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(trimmedMessage)) {
          const version = this.detectVersion(trimmedMessage, format)
          return {
            format,
            version,
            confidence: this.calculateConfidence(trimmedMessage, format)
          }
        }
      }
    }

    // Additional checks for edge cases
    
    // Check if it's valid JSON
    try {
      const parsed = JSON.parse(trimmedMessage)
      if (typeof parsed === 'object') {
        // Check if it's FHIR JSON
        if (parsed.resourceType || (parsed.entry && parsed.entry[0] && parsed.entry[0].resource)) {
          const version = this.detectVersion(trimmedMessage, 'fhir')
          return { format: 'fhir', version, confidence: 0.9 }
        }
        return { format: 'json', version: null, confidence: 0.8 }
      }
    } catch (e) {
      // Not JSON, continue
    }

    // Check if it's valid XML
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(trimmedMessage, 'text/xml')
      if (!doc.querySelector('parsererror')) {
        const rootElement = doc.documentElement
        
        // Check for FHIR XML
        if (rootElement.getAttribute('xmlns') && rootElement.getAttribute('xmlns').includes('fhir')) {
          const version = this.detectVersion(trimmedMessage, 'fhir')
          return { format: 'fhir', version, confidence: 0.9 }
        }
        
        // Check for HL7 v3 (CDA)
        if (rootElement.tagName === 'ClinicalDocument' || 
            (rootElement.getAttribute('xmlns') && rootElement.getAttribute('xmlns').includes('hl7'))) {
          const version = this.detectVersion(trimmedMessage, 'hl7v3')
          return { format: 'hl7v3', version, confidence: 0.9 }
        }
        
        const version = this.detectVersion(trimmedMessage, 'xml')
        return { format: 'xml', version, confidence: 0.7 }
      }
    } catch (e) {
      // Not XML, continue
    }

    return null
  }

  detectVersion(message, format) {
    if (!this.versionPatterns[format]) {
      return null
    }

    for (const { pattern, version } of this.versionPatterns[format]) {
      const match = message.match(pattern)
      if (match) {
        return match[1] ? match[1] : version
      }
    }

    return null
  }

  calculateConfidence(message, format) {
    let confidence = 0.5
    
    // Increase confidence based on format-specific characteristics
    switch (format) {
      case 'hl7v2':
        if (message.includes('MSH|')) confidence += 0.3
        if (message.includes('PID|')) confidence += 0.1
        if (message.includes('OBX|')) confidence += 0.1
        break
        
      case 'hl7v3':
        if (message.includes('ClinicalDocument')) confidence += 0.3
        if (message.includes('xmlns') && message.includes('hl7')) confidence += 0.2
        break
        
      case 'fhir':
        if (message.includes('resourceType')) confidence += 0.3
        if (message.includes('Bundle') || message.includes('Patient')) confidence += 0.1
        break
        
      case 'astm':
        if (/\d+H\|/.test(message)) confidence += 0.2
        if (/\d+L\|/.test(message)) confidence += 0.1
        if (message.includes('STX') || message.includes('ETX')) confidence += 0.1
        break
        
      case 'json':
        try {
          JSON.parse(message)
          confidence += 0.3
        } catch (e) {
          confidence -= 0.2
        }
        break
        
      case 'xml':
        if (message.includes('<?xml')) confidence += 0.2
        if (message.includes('xmlns')) confidence += 0.1
        break
    }

    return Math.min(confidence, 1.0)
  }

  getMessageType(message, format) {
    if (format === 'hl7v2') {
      const mshMatch = message.match(/MSH\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|([^|^]*)/i)
      if (mshMatch && mshMatch[1]) {
        return mshMatch[1].split('^')[0]
      }
    }
    
    if (format === 'fhir') {
      const resourceMatch = message.match(/"resourceType"\s*:\s*"([^"]+)"/i)
      if (resourceMatch && resourceMatch[1]) {
        return resourceMatch[1]
      }
    }
    
    return null
  }
}