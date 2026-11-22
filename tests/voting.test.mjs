import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveVote } from '../lib/voting.ts';
import { imageError, MAX_IMAGE_BYTES } from '../lib/image-validation.ts';

function database(initial, { denied = false, wrongUser = false, zeroRows = false } = {}) {
    let value = initial;
    const operations = [];
    const db = {
        auth: { getUser: async () => ({ data: { user: { id: wrongUser ? 'other' : 'user' } }, error: null }) },
        from(table) {
            assert.equal(table, 'votes');
            let operation, payload;
            const filters = {};
            const q = {
                delete() { operation = 'DELETE'; return q; },
                insert(row) { operation = 'INSERT'; payload = row; return q; },
                update(row) { operation = 'UPDATE'; payload = row; return q; },
                eq(key, value) { filters[key] = value; return q; },
                async select() {
                    operations.push(operation);
                    if (denied) return { error: { message: 'Permission denied' }, data: null };
                    if (zeroRows) return { error: null, data: [] };
                    if (operation !== 'INSERT') assert.deepEqual(filters, { user_id: 'user', caption_id: 'caption' });
                    else assert.deepEqual(payload, { user_id: 'user', caption_id: 'caption', value: payload.value });
                    const old = value;
                    value = operation === 'DELETE' ? null : payload.value;
                    return { error: null, data: [{ value: operation === 'DELETE' ? old : value }] };
                },
            };
            return q;
        },
    };
    return { db, operations, persisted: () => value };
}
for (const [initial, click, expected, method] of [
    [null, 1, 1, 'INSERT'], [null, -1, -1, 'INSERT'],
    [1, 1, null, 'DELETE'], [-1, -1, null, 'DELETE'],
    [1, -1, -1, 'UPDATE'], [-1, 1, 1, 'UPDATE'],
]) test(`${initial} + click ${click} uses ${method}`, async () => {
    const d = database(initial);
    assert.equal(await saveVote(d.db, 'user', 'caption', initial, click), expected);
    assert.equal(d.persisted(), expected);
    assert.deepEqual(d.operations, [method]);
});
test('permission failure does not report success', async () => {
    const d = database(1, { denied: true });
    await assert.rejects(saveVote(d.db, 'user', 'caption', 1, 1), /Permission denied/);
    assert.equal(d.persisted(), 1);
});
test('zero-row UPDATE is rejected', async () => {
    const d = database(1, { zeroRows: true });
    await assert.rejects(saveVote(d.db, 'user', 'caption', 1, -1), /could not be confirmed/);
});
test('changed session cannot mutate votes', async () => {
    const d = database(null, { wrongUser: true });
    await assert.rejects(saveVote(d.db, 'user', 'caption', null, 1), /session has changed/);
    assert.deepEqual(d.operations, []);
});
test('upload accepts supported images within limit', () => {
    assert.equal(imageError({ size: MAX_IMAGE_BYTES, type: 'image/jpeg' }), null);
});
test('upload rejects empty, oversized, and unsupported photos', () => {
    for (const file of [{ size: 0, type: 'image/png' }, { size: MAX_IMAGE_BYTES + 1, type: 'image/png' }, { size: 10, type: 'image/heic' }]) assert.ok(imageError(file));
});
