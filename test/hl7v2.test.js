import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'

const p = new MessageParser()

// Built by position so the test never depends on counting pipes by hand
const seg = (type, values) => {
  const parts = [type]
  for (const [pos, v] of Object.entries(values)) parts[pos] = v
  return Array.from(parts, v => v ?? '').join('|')
}

export const PID = seg('PID', { 1: '1', 3: 'P1^^^HOSP^MR~M2^^^HOSP^MRN', 5: 'DOE^JOHN^Q', 7: '19800101', 8: 'M', 11: '1 Main St^^Springfield^IL^62701', 13: '(555)555-1234', 18: 'ACC1', 30: 'N' })
export const PV1 = seg('PV1', { 1: '1', 2: 'I', 3: 'W1^101^A', 4: 'E', 7: 'D1^SMITH^ANN', 10: 'MED', 19: 'V99', 44: '20240101120000' })
export const ADT = [
  'MSH|^~\\&|APP|FAC|HIS|HOSP|20240101120000||ADT^A01^ADT_A01|MSG001|P|2.5.1',
  PID,
  PV1,
  'OBX|1|NM|GLU^Glucose^L||95|mg/dL|70-110|N|||F',
  'OBX|2|ST|NOTE^Note^L||Line1\\.br\\Line2 \\T\\ more||||||F',
  'ZXX|a|b'
]

test('CR-only, LF, CRLF and MLLP framing all yield every segment', () => {
  for (const text of [ADT.join('\r'), ADT.join('\n'), ADT.join('\r\n'), `\x0b${ADT.join('\r')}\x1c\r`]) {
    assert.equal(p.parse(text, 'hl7v2').analysis.segmentCount, 6)
  }
})

test('MSH field names line up with HL7 positions', () => {
  const msh = p.parse(ADT.join('\r'), 'hl7v2').analysis.segments[0]
  const byPos = n => msh.fields.find(f => f.position === n)
  assert.deepEqual([byPos(1).name, byPos(1).value], ['Field Separator', '|'])
  assert.deepEqual([byPos(2).name, byPos(2).value], ['Encoding Characters', '^~\\&'])
  assert.deepEqual([byPos(3).name, byPos(3).value], ['Sending Application', 'APP'])
  assert.deepEqual([byPos(9).name, byPos(9).value], ['Message Type', 'ADT^A01^ADT_A01'])
})

test('every PID and PV1 field is returned with its standard name', () => {
  const { segments } = p.parse(ADT.join('\r'), 'hl7v2').analysis
  const pid = segments.find(s => s.type === 'PID')
  const pv1 = segments.find(s => s.type === 'PV1')
  assert.equal(pid.fields.length, 30)
  assert.equal(pv1.fields.length, 44)
  assert.deepEqual(pid.fields.find(f => f.position === 18), { name: 'Patient Account Number', value: 'ACC1', position: 18, dataType: 'CX' })
  assert.equal(pid.fields.find(f => f.position === 30).name, 'Patient Death Indicator')
  assert.equal(pv1.fields.find(f => f.position === 19).name, 'Visit Number')
  assert.deepEqual(pv1.fields.find(f => f.position === 44), { name: 'Admit Date/Time', value: '20240101120000', position: 44, dataType: 'TS' })
})

test('unknown segments fall back to positional names', () => {
  const zxx = p.parse(ADT.join('\r'), 'hl7v2').analysis.segments.find(s => s.type === 'ZXX')
  assert.deepEqual(zxx.fields.map(f => f.name), ['ZXX-1', 'ZXX-2'])
})

test('version and message type come from MSH-12 and MSH-9', () => {
  const r = p.parse(ADT.join('\r'), 'hl7v2')
  assert.equal(r.version, '2.5.1')
  assert.equal(r.analysis.messageType, 'ADT^A01 - Admission, discharge, transfer')
})

test('a message without MSH is rejected', () => {
  assert.throws(() => p.parse('PID|1||X', 'hl7v2'), /No MSH segment/)
})

test('components, repetitions and subcomponents are mapped by name', () => {
  const tree = p.parse(ADT.join('\r'), 'hl7v2').analysis.detailedStructure
  const pid = tree['PID - Patient Identification']
  assert.equal(pid['PID-5 Patient Name']['PID-5.1 Family Name'], 'DOE')
  assert.equal(pid['PID-5 Patient Name']['PID-5.2 Given Name'], 'JOHN')
  assert.equal(pid['PID-3 Patient Identifier List'].length, 2)
  assert.equal(pid['PID-3 Patient Identifier List'][1]['PID-3.1 ID Number'], 'M2')
  assert.equal(pid['PID-11 Patient Address']['PID-11.3 City'], 'Springfield')
  assert.equal(tree['PV1 - Patient Visit']['PV1-3 Assigned Patient Location']['PV1-3.2 Room'], '101')
  assert.equal(tree['PV1 - Patient Visit']['PV1-44 Admit Date/Time'], '20240101120000')
  assert.equal(tree['MSH - Message Header']['MSH-2 Encoding Characters'], '^~\\&')
  assert.equal('PID-2 Patient ID' in pid, false) // empty fields are omitted from the tree
})

test('subcomponents split on &', () => {
  const msg = ['MSH|^~\\&|A|B|C|D|20240101||ORU^R01|1|P|2.5.1', 'PID|1||123^^^HOSP&1.2.3&ISO^MR'].join('\r')
  const cx = p.parse(msg, 'hl7v2').analysis.detailedStructure['PID - Patient Identification']['PID-3 Patient Identifier List']
  assert.deepEqual(cx['PID-3.4 Assigning Authority'], { 'PID-3.4.1': 'HOSP', 'PID-3.4.2': '1.2.3', 'PID-3.4.3': 'ISO' })
})

test('repeated segments are kept separately', () => {
  const tree = p.parse(ADT.join('\r'), 'hl7v2').analysis.detailedStructure
  assert.equal(tree['OBX #1 - Observation/Result']['OBX-5 Observation Value'], '95')
  assert.ok(tree['OBX #2 - Observation/Result'])
  assert.ok(tree['PID - Patient Identification']) // single segments carry no #n
})

test('HL7 escape sequences are decoded', () => {
  const tree = p.parse(ADT.join('\r'), 'hl7v2').analysis.detailedStructure
  assert.equal(tree['OBX #2 - Observation/Result']['OBX-5 Observation Value'], 'Line1\nLine2 & more')
})

test('custom encoding characters from MSH-2 are honored', () => {
  const msg = ['MSH|*~\\&|A|B|C|D|20240101||ADT*A08|1|P|2.5', 'PID|1||X1||ROE*JANE'].join('\r')
  const r = p.parse(msg, 'hl7v2')
  assert.equal(r.analysis.detailedStructure['PID - Patient Identification']['PID-5 Patient Name']['PID-5.2 Given Name'], 'JANE')
  assert.equal(r.analysis.messageType, 'ADT^A08 - Admission, discharge, transfer')
})

test('patient name summary comes from PID-5', () => {
  assert.equal(p.parse(ADT.join('\r'), 'hl7v2').analysis.patientName, 'JOHN DOE')
})

test('HL7 formatting escapes do not leak into values', () => {
  const msg = ['MSH|^~\\&|A|B|C|D|20240101||ORU^R01|1|P|2.5.1', 'OBX|1|FT|A||\\H\\bold\\N\\ text\\.sp\\x \\Zfoo\\end'].join('\r')
  const tree = p.parse(msg, 'hl7v2').analysis.detailedStructure
  assert.equal(tree['OBX - Observation/Result']['OBX-5 Observation Value'], 'bold text\nx end')
})
