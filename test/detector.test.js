import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FormatDetector } from '../src/modules/FormatDetector.js'

const d = new FormatDetector()
const detect = m => d.detectFormat(m)

test('HL7 v2 with 2.5.1 reports the full MSH-12 version', () => {
  assert.deepEqual(detect('MSH|^~\\&|A|B|C|D|20240101||ORU^R01|1|P|2.5.1\rPID|1'), { format: 'hl7v2', version: '2.5.1' })
})

test('HL7 v2 batch (FHS/BHS first) is still HL7 v2', () => {
  assert.equal(detect('FHS|^~\\&|A\rBHS|^~\\&|A\rMSH|^~\\&|A|B|C|D|1||ADT^A01|1|P|2.5').format, 'hl7v2')
})

test('any FHIR XML resource is FHIR, not generic XML', () => {
  assert.equal(detect('<Observation xmlns="http://hl7.org/fhir"><status value="final"/></Observation>').format, 'fhir')
})

test('FHIR JSON that mentions C-CDA stays FHIR', () => {
  assert.equal(detect('{"resourceType":"Composition","title":"Converted from C-CDA"}').format, 'fhir')
})

test('CDA and V3 messages are hl7v3', () => {
  assert.equal(detect('<ClinicalDocument xmlns="urn:hl7-org:v3"><title>x</title></ClinicalDocument>').format, 'hl7v3')
  assert.equal(detect('<PRPA_IN201305UV02 xmlns="urn:hl7-org:v3"/>').format, 'hl7v3')
})

test('plain JSON and XML fall through', () => {
  assert.equal(detect('{"a":1}').format, 'json')
  assert.equal(detect('<?xml version="1.0"?><a/>').format, 'xml')
  assert.equal(detect('just text'), null)
})
