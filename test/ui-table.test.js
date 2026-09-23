import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'
import { UIController } from '../src/modules/UIController.js'

const ui = new UIController()
const table = xml => new MessageParser().parse(`<ClinicalDocument xmlns="urn:hl7-org:v3">${xml}</ClinicalDocument>`, 'hl7v3').analysis.detailedStructure.table
const rows = node => node.children.map(r => Object.fromEntries(r.children.map(c => [c.key, c.value])))

test('narrative table cells: empty, <content> and header markup render as text', () => {
  const t = table('<table><thead><tr><th><content>Med</content></th><th>Reaction</th></tr></thead>' +
    '<tbody><tr><td><content ID="m1">Aspirin</content> tablet</td><td></td></tr></tbody></table>')
  assert.deepEqual(rows(ui.processTableStructure(t, 'table', 0)), [{ Med: 'Aspirin tablet', Reaction: '' }])
})

test('multiple tbody and tfoot rows are all shown', () => {
  const t = table('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody>' +
    '<tbody><tr><td>2</td></tr></tbody><tfoot><tr><td>3</td></tr></tfoot></table>')
  assert.deepEqual(rows(ui.processTableStructure(t, 'table', 0)), [{ A: '1' }, { A: '2' }, { A: '3' }])
})
