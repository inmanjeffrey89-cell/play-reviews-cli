// One page of 3 reviews and no continuation token.
const rv = (i) => ['id' + i, ['user'], 4, null, 'text', [1700000000], 0, null, null, null, '1.0'];
globalThis.fetch = async () => new Response(")]}'\n\n" + JSON.stringify([['wrb.fr', 'UsvDTd', JSON.stringify([[rv(1), rv(2), rv(3)], null]), null, null, null, 'generic']]));
