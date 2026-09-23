import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'
import { FormatDetector } from '../src/modules/FormatDetector.js'

const p = new MessageParser()
// Same shape SyntheticDataGenerator.generateASTM* produces (no frame numbers)
const RECORDS = [
  'H|\\^&|||LIS^1.0|||||HOST||P|LIS2-A2|20240101120000',
  'P|1|PRAC1|LAB1||DOE^JOHN^Q||19800101|M',
  'O|1|S1||^^^GLU^Glucose|R',
  'R|1|^^^GLU|95|mg/dL|70-110|N||F',
  'C|1|I|Na &F& K|G',
  'L|1|N'
]

test('records without frame numbers are parsed (generator output)', () => {
  const r = p.parse(RECORDS.join('\n'), 'astm')
  assert.equal(r.analysis.recordCount, 6)
  assert.deepEqual(r.analysis.recordTypes, ['H', 'P', 'O', 'R', 'C', 'L'])
})

test('frame-number prefixes and CR separators are accepted', () => {
  const framed = RECORDS.map((l, i) => `${(i + 1) % 8}${l}`).join('\r')
  assert.equal(p.parse(framed, 'astm').analysis.recordCount, 6)
})

test('field names follow E1394 positions (field 1 = record type, 2 = sequence)', () => {
  const [, pRec, , rRec] = p.parse(RECORDS.join('\n'), 'astm').analysis.records
  const at = (rec, n) => rec.fields.find(f => f.position === n)
  assert.deepEqual([at(pRec, 2).name, at(pRec, 2).value], ['Sequence Number', '1'])
  assert.deepEqual([at(pRec, 3).name, at(pRec, 3).value], ['Practice Assigned Patient ID', 'PRAC1'])
  assert.deepEqual([at(pRec, 6).name, at(pRec, 6).value], ['Patient Name', 'DOE^JOHN^Q'])
  assert.deepEqual([at(rRec, 4).name, at(rRec, 4).value], ['Data or Measurement Value', '95'])
  assert.equal(pRec.sequence, '1')
})

test('components and escapes land in the tree', () => {
  const tree = p.parse(RECORDS.join('\n'), 'astm').analysis.detailedStructure
  assert.equal(tree['P #1 - Patient Information']['P-6 Patient Name']['P-6.1 Last Name'], 'DOE')
  assert.equal(tree['R #1 - Result']['R-3 Universal Test ID']['R-3.4 Manufacturer\'s or Local Code'], 'GLU')
  assert.equal(tree['C #1 - Comment']['C-4 Comment Text'], 'Na | K')
  assert.equal(tree['H #1 - Header']['H-2 Delimiter Definition'], '\\^&')
})

test('E1381 frames: STX/ETX/checksum stripped, ETB-split records rejoined', () => {
  const wire = '\x05' +
    '\x021H|\\^&|||LIS\r\x03A1\r\n' +
    '\x022R|1|^^^GLU|9\x17B2\r\n' +
    '\x0235|mg/dL\r\x03C3\r\n' +
    '\x04'
  const r = p.parse(wire, 'astm')
  assert.equal(r.analysis.recordCount, 2)
  const res = r.analysis.detailedStructure['R #1 - Result']
  assert.equal(res['R-4 Data or Measurement Value'], '95')
  assert.equal(res['R-5 Units'], 'mg/dL')
})

test('patient name and version come from P-6 and H-13', () => {
  const r = p.parse(RECORDS.join('\n'), 'astm')
  assert.equal(r.analysis.patientName, 'JOHN DOE')
  assert.equal(r.version, 'LIS2-A2')
})

test('input with no ASTM records is rejected', () => {
  assert.throws(() => p.parse('hello world', 'astm'), /No ASTM records/)
})

test('detector recognizes unframed ASTM', () => {
  assert.equal(new FormatDetector().detectFormat(RECORDS.join('\n')).format, 'astm')
})
