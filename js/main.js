let md5 = function() {
  const k = [];
  let i = 0;

  for (; i < 64;) {
    k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296);
  }

  function calcMD5(str) {
    let b; let c; let d; let j;
    const x = [];
    const str2 = unescape(encodeURI(str));
    let a = str2.length;
    const h = [b = 1732584193, c = -271733879, ~b, ~c];
    let i = 0;

    for (; i <= a;) x[i >> 2] |= (str2.charCodeAt(i) || 128) << 8 * (i++ % 4);

    x[str = (a + 8 >> 6) * 16 + 14] = a * 8;
    i = 0;

    for (; i < str; i += 16) {
      a = h; j = 0;
      for (; j < 64;) {
        a = [
          d = a[3],
          ((b = a[1] | 0) +
            ((d = (
              (a[0] +
                [
                  b & (c = a[2]) | ~b & d,
                  d & b | ~d & c,
                  b ^ c ^ d,
                  c ^ (b | ~d)
                ][a = j >> 4]
              ) +
              (k[j] +
                (x[[
                  j,
                  5 * j + 1,
                  3 * j + 5,
                  7 * j
                ][a] % 16 + i] | 0)
              )
            )) << (a = [
              7, 12, 17, 22,
              5, 9, 14, 20,
              4, 11, 16, 23,
              6, 10, 15, 21
            ][4 * a + j++ % 4]) | d >>> 32 - a)
          ),
          b,
          c
        ];
      }
      for (j = 4; j;) h[--j] = h[j] + a[j];
    }

    str = [];
    for (; j < 32;) str.push(((h[j >> 3] >> ((1 ^ j++ & 7) * 4)) & 15) * 16 + ((h[j >> 3] >> ((1 ^ j++ & 7) * 4)) & 15));

    return new Uint8Array(str);
  }
  return calcMD5;
}();

function uidBytesFromText(txt) {
  // If text is 4-6 numbers separated with [commas]/[spaces] use as a literal UID
  // This is a strict parser to not just extract numbers from text, but only accept if text is only UID bytes
  if (/^[0-9, ]+$/.test(txt))
  {
    let asArray = txt.split(',').filter(isValidUidByte).map(Number);
    if (asArray.length >= 4 && asArray.length <= 6)
    {
      while (asArray.length < 6)
        asArray.unshift(0);
      return asArray;
    }
  }

  const bindingPhraseFull = `-DMY_BINDING_PHRASE="${txt}"`;
  const bindingPhraseHashed = md5(bindingPhraseFull);
  return bindingPhraseHashed.subarray(0, 6);
}

function uidBytesToText(uid) {
	let result = uid.join(',');
	return result;
}

function arraysMatch(arr1, arr2) {
	// Check if the arrays have the same length
	if (arr1.length !== arr2.length) {
		return false;
	}

	// Check if all elements are the same
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) {
			return false;
		}
	}

	return true;
}

function radioGroupUnchecked(grp)
{
	let res = $('input[name="' + grp + '"]:checked').length === 0;
	return res;
}

function compareVersions(a, b) {
    // Remove any dashes and anything following them
    const cleanA = a.split('-')[0];
    const cleanB = b.split('-')[0];

    // Split the version numbers and convert to numbers
    const aParts = cleanA.split('.').map(Number);
    const bParts = cleanB.split('.').map(Number);

    // Ensure both arrays have three parts by adding zeros if necessary
    while (aParts.length < 3) aParts.push(-1);
    while (bParts.length < 3) bParts.push(-1);

    // Compare each part of the version numbers
    for (let i = 0; i < 3; i++) {
        if (aParts[i] > bParts[i]) return -1;
        if (aParts[i] < bParts[i]) return 1;
    }
    return 0;
}
