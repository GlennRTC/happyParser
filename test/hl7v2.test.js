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
