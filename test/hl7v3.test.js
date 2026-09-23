import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'

const p = new MessageParser()
const CCD = `<?xml version="1.0"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <templateId root="2.16.840.1.113883.10.20.22.1.1"/>
  <code code="34133-9" codeSystem="2.16.840.1.113883.6.1"/>
  <title>Summary of Care</title>
  <recordTarget><patientRole><id extension="123" root="1.2.3"/>
    <patient><name><given>Jane</given><given>Q</given><family>Roe</family></name></patient>
  </patientRole></recordTarget>
  <component><structuredBody>
    <component><section><title>Allergies</title><text>No known <content>allergies</content></text>
      <entry><act><entryRelationship><observation><entryRelationship><observation>
        <value code="X"/>
      </observation></entryRelationship></observation></entryRelationship></act></entry>
    </section></component>
    <component><section><title>Medications</title></section></component>
  </structuredBody></component>
</ClinicalDocument>`

test('C-CDA header, patient and section count are extracted', () => {
  const r = p.parse(CCD, 'hl7v3')
  assert.equal(r.version, 'C-CDA')
  assert.equal(r.analysis.documentType, 'Summary of Care')
  assert.equal(r.analysis.templateId, '2.16.840.1.113883.10.20.22.1.1')
  assert.equal(r.analysis.code, '34133-9')
  assert.equal(r.analysis.patientName, 'Jane Q Roe')
  assert.equal(r.analysis.sectionCount, 2)
})

test('the tree reaches the deepest entry and keeps mixed narrative text and <name>', () => {
  const t = p.parse(CCD, 'hl7v3').analysis.detailedStructure
  const section = t.component.structuredBody.component[0].section
  assert.equal(section.entry.act.entryRelationship.observation.entryRelationship.observation.value['@attributes'].code, 'X')
  assert.match(section.text['#text'], /No known/)
  assert.equal(t.recordTarget.patientRole.patient.name.family['#text'], 'Roe')
})

test('V3 messaging (non-CDA) is labelled by its interaction id', () => {
  const r = p.parse('<PRPA_IN201305UV02 xmlns="urn:hl7-org:v3" ITSVersion="XML_1.0"><id root="1"/></PRPA_IN201305UV02>', 'hl7v3')
  assert.equal(r.version, 'V3 Messaging')
  assert.equal(r.analysis.documentType, 'PRPA_IN201305UV02')
})

test('malformed XML is rejected with a location', () => {
  assert.throws(() => p.parse('<ClinicalDocument><title></ClinicalDocument>', 'hl7v3'), /Invalid XML.*line 1/)
})

test('generic XML keeps namespaces and counts elements', () => {
  const r = p.parse('<?xml version="1.0"?><root xmlns:a="urn:a"><a:item id="1">x</a:item><a:item id="2"/></root>', 'xml')
  assert.equal(r.version, '1.0')
  assert.deepEqual(r.analysis.namespaces, ['xmlns:a="urn:a"'])
  assert.equal(r.analysis.elementCount, 3)
  assert.equal(r.analysis.detailedStructure['a:item'].length, 2)
})
