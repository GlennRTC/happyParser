import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'

const p = new MessageParser()
const BUNDLE = JSON.stringify({
  resourceType: 'Bundle', type: 'collection',
  entry: [
    { fullUrl: 'urn:uuid:1', resource: { resourceType: 'Patient', id: '1', name: [{ given: ['John'], family: 'Doe' }] } },
    { resource: { resourceType: 'Observation', id: 'o1', subject: { reference: 'Patient/1' }, valueQuantity: { value: 95, unit: 'mg/dL' } } },
    { resource: { resourceType: 'Observation', id: 'o2', subject: { reference: 'Patient/1' } } }
  ]
})

test('Bundle summary data: type, entry count, resource counts, patient', () => {
  const a = p.parse(BUNDLE, 'fhir').analysis
  assert.equal(a.bundleType, 'collection')
  assert.equal(a.entryCount, 3)
  assert.deepEqual(a.resourceCounts, { Patient: 1, Observation: 2 })
  assert.equal(a.patientName, 'John Doe')
  assert.equal(a.detailedStructure.entry[1].resource.valueQuantity.unit, 'mg/dL')
})

test('non-Patient resources report their subject', () => {
  const obs = JSON.stringify({ resourceType: 'Observation', subject: { reference: 'Patient/1' } })
  assert.equal(p.parse(obs, 'fhir').analysis.patientName, 'Patient/1')
})

test('FHIR XML is converted to the JSON model', () => {
  const xml = '<Patient xmlns="http://hl7.org/fhir"><id value="p1"/><name><family value="Doe"/><given value="John"/></name><gender value="male"/></Patient>'
  const a = p.parse(xml, 'fhir').analysis
  assert.equal(a.resourceType, 'Patient')
  assert.equal(a.detailedStructure.id, 'p1')
  assert.equal(a.detailedStructure.gender, 'male')
  assert.equal(a.patientName, 'John Doe')
})

test('FHIR XML Bundle: resource wrappers become resourceType, entry is always an array', () => {
  const xml = '<Bundle xmlns="http://hl7.org/fhir"><type value="collection"/><entry><resource><Patient><id value="p1"/></Patient></resource></entry></Bundle>'
  const a = p.parse(xml, 'fhir').analysis
  assert.equal(a.entryCount, 1)
  assert.equal(a.detailedStructure.entry[0].resource.resourceType, 'Patient')
  assert.deepEqual(a.resourceCounts, { Patient: 1 })
})
