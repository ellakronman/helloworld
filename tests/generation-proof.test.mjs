import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signGeneration, verifyGeneration } from '../lib/generation-proof.ts';
const key = 'test-key-not-a-real-credential';
const data = { userId: 'user', imageUrl: 'https://example.test/image.jpg', description: 'Test description', captions: ['one','two','three','four'] };
test('server-produced generation round trips for its owner', () => {
    const token = signGeneration(data, key);
    assert.deepEqual(verifyGeneration(token, 'user', key).captions, data.captions);
});
test('forged, wrong-owner, wrong-key and malformed receipts are rejected', () => {
    const token = signGeneration(data, key);
    assert.equal(verifyGeneration(token, 'other-user', key), null);
    assert.equal(verifyGeneration(token, 'user', 'wrong-key'), null);
    const [payload, mac] = token.split('.');
    const altered = JSON.parse(Buffer.from(payload, 'base64url'));
    altered.captions[0] = 'client-forged';
    assert.equal(verifyGeneration(Buffer.from(JSON.stringify(altered)).toString('base64url') + '.' + mac, 'user', key), null);
    for (const value of [null, {}, '', 'bad.signature', token + '.extra']) assert.equal(verifyGeneration(value, 'user', key), null);
});
test('expired generation cannot be saved', (t) => {
    t.mock.method(Date, 'now', () => 1000);
    const token = signGeneration(data, key);
    Date.now.mock.mockImplementation(() => 1000 + 86_400_001);
    assert.equal(verifyGeneration(token, 'user', key), null);
});
