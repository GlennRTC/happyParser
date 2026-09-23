export class FormatDetector {
  constructor() {
    // Order matters: the first matching format wins
    this.patterns = {
      hl7v2: [/(^|[\r\n])MSH\|/],
      fhir: [/"resourceType"\s*:\s*"[A-Z][A-Za-z]+"/, /<\w+[^>]*xmlns="http:\/\/hl7\.org\/fhir"/],
      hl7v3: [/<(\w+:)?ClinicalDocument[\s>]/, /xmlns(:\w+)?="urn:hl7-org:v3"/],
      astm: [/^\x05?\x02?\d?[HPORL]\|/],
      json: [/^\s*[{[]/],
      xml: [/^\s*<[^>]+>/]
    }

    this.versionPatterns = {
      hl7v2: [{ pattern: /(?:^|[\r\n])MSH\|(?:[^|]*\|){10}([^|^\r\n]+)/ }],
      hl7v3: [
        { pattern: /templateId[^>]*2\.16\.840\.1\.113883\.10\.20\.22\.1\.1\b/i, version: 'C-CDA R2.1 CCD' },
        { pattern: /templateId[^>]*2\.16\.840\.1\.113883\.10\.20\.22\.1\.4\b/i, version: 'C-CDA R2.1 Consultation Note' },
        { pattern: /templateId[^>]*2\.16\.840\.1\.113883\.10\.20\.22/i, version: 'C-CDA R2.1' },
        { pattern: /<(\w+:)?ClinicalDocument[\s>]/, version: 'CDA R2' }
      ],
      fhir: [
        { pattern: /"fhirVersion"\s*:\s*"([^"]+)"/i },
        { pattern: /xmlns="http:\/\/hl7\.org\/fhir"/, version: 'FHIR' }
      ],
      astm: [{ pattern: /LIS2-A2|E1394|E1381|E1238/ }]
    }
  }

  detectFormat(message) {
    if (!message || typeof message !== 'string') return null
    const text = message.trim()
    for (const [format, patterns] of Object.entries(this.patterns)) {
      if (patterns.some(p => p.test(text))) return { format, version: this.detectVersion(text, format) }
    }
    return null
  }

  detectVersion(message, format) {
    for (const { pattern, version } of this.versionPatterns[format] || []) {
      const match = message.match(pattern)
      if (match) return match[1] ?? version ?? match[0]
    }
    return null
  }
}
