import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MessageParser } from '../src/modules/MessageParser.js'

const p = new MessageParser()

test('plain JSON is parsed with type and depth', () => {
  const a = p.parse('{"a":{"b":[1]}}', 'json').analysis
  assert.equal(a.type, 'Object')
  assert.equal(a.depth, 3)
})

test('oversized and invalid input are rejected with the format in the message', () => {
  assert.throws(() => p.parse(' '.repeat(10 * 1024 * 1024 + 1), 'json'), /Failed to parse json message: Message too large/)
  assert.throws(() => p.parse('{', 'json'), /Failed to parse json message/)
  assert.throws(() => p.parse('x', 'nope'), /Unsupported format: nope/)
})
