// Page 1: 100 reviews + a token. Page 2: the null-payload + status array Play sends when it
// rejects a continuation token (shape captured live).
let n = 0;
const rv = (i) => ['id' + i, ['user'], 5, null, 'text', [1700000000], 0, null, null, null, '1.0'];
const env = (p, status = null) => JSON.stringify([['wrb.fr', 'UsvDTd', p, null, null, status, 'generic']]);
globalThis.fetch = async () => new Response(n++ === 0
  ? ")]}'\n\n" + env(JSON.stringify([Array.from({ length: 100 }, (_, i) => rv(i)), [null, 'tok']]))
  : ")]}'\n\n" + env(null, [5, null, [['type.googleapis.com/wireless.android.finsky.boq.web.data.store.error.PlayDataError', [1]]]]));
