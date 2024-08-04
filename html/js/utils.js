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
  let bindingPhraseHashed = md5(bindingPhraseFull);
  bindingPhraseHashed = bindingPhraseHashed.subarray(0, 6);
  return [...bindingPhraseHashed];
}

function uidBytesToText(uid) {
	let result = uid.join(',');
	return result;
}

function bytesFromText(txt) {
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
}

function isValidUidByte(s) {
  let f = parseFloat(s);
  return !isNaN(f) && isFinite(s) && Number.isInteger(f) && f >= 0 && f < 256;
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

function minifyJSON(jsonString) {
  try {
    let jsonObject;
    if (typeof jsonString === "string") {
      jsonObject = JSON.parse(jsonString);
    }
    else {
      jsonObject = jsonString;
    }
    var minifiedJSON = JSON.stringify(jsonObject);
    return minifiedJSON;
  } catch (e) {
    console.log("ERROR while minifying JSON: " + e.message);
    return false;
  }
}

function prettifyJSON(jsonString) {
  try {
    let jsonObject;
    if (typeof jsonString === "string") {
      jsonObject = JSON.parse(jsonString);
    }
    else {
      jsonObject = jsonString;
    }
    var minifiedJSON = JSON.stringify(jsonObject, null, 2);
    return minifiedJSON;
  } catch (e) {
    console.log("ERROR while prettifying JSON: " + e.message);
    return false;
  }
}

function validateJSON(jsonString) {
	let x = minifyJSON(jsonString);
	if (x === false) {
		return false;
	}
	else {
		return true;
	}
}

function uint8ArrayToString(uint8Array) {
    // Convert Uint8Array to string
    let str = String.fromCharCode.apply(null, uint8Array);
    
    // Trim null characters
    return str.replace(/\0+$/, '');
}

function stringToUint8Array(str, length) {
    // Encode the string as UTF-8
    let encoder = new TextEncoder();
    let encodedStr = encoder.encode(str);

    // Check if the encoded string is too long
    if (encodedStr.length > length) {
        throw new Error("String is too long to fit in the specified length");
    }

    // Create a Uint8Array of the specified length
    let uint8Array = new Uint8Array(length);

    // Copy the encoded string into the Uint8Array
    uint8Array.set(encodedStr);

    return uint8Array;
}

function mergeJSONObjects(obj1, obj2) {
    let mergedObject = {};

    // Add all keys from obj2 to mergedObject
    for (let key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            mergedObject[key] = obj2[key];
        }
    }

    // Add all keys from obj1 to mergedObject, overwriting any existing keys from obj2
    for (let key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            mergedObject[key] = obj1[key];
        }
    }

    return mergedObject;
}

function areJSONObjectsEqual(a, b) {
    if (a === b) return true;

    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

    let keysA = Object.keys(a).sort(), keysB = Object.keys(b).sort();

    if (keysA.length !== keysB.length) return false;

    for (let key of keysA) {
        if (!keysB.includes(key)) return false;
        if (typeof a[key] === 'object' && a[key] !== null && typeof b[key] === 'object' && b[key] !== null) {
            if (!deepEqual(a[key], b[key])) return false;
        } else {
            if (a[key] !== b[key]) return false;
        }
    }

    return true;
}

function isValidGpioPin(obj, key)
{
	if (obj.hasOwnProperty(key) == false) {
		return false;
	}
	let v = obj[key];
	if (typeof v === "string") {
		let x = parseInt(v);
		if (isNaN(x)) {
			return false;
		}
		if (x >= 0) {
			return true;
		}
		return false;
	}
	else if (typeof v === "number")
	{
		if (v >= 0) {
			return true;
		}
		return false;
	}
}

function xor(a, b) {
    return (a || b) && !(a && b);
}

function levenshteinDistance(a, b) {
    const matrix = [];

    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }

    return matrix[b.length][a.length];
}

function findClosestStringMatch(input, list) {
	let closestMatch = list[0];
	let closestDistance = levenshteinDistance(input, closestMatch);

	for (let i = 1; i < list.length; i++) {
		const distance = levenshteinDistance(input, list[i]);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestMatch = list[i];
		}
	}

	return closestMatch;
}

function findClosestStringMatchIdx(input, list) {
	let closestMatchI = 0;
	let closestMatch = list[closestMatchI];
	let closestDistance = levenshteinDistance(input, closestMatch);

	for (let i = 1; i < list.length; i++) {
		const distance = levenshteinDistance(input, list[i]);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestMatchI = i;
			closestMatch = list[i];
		}
	}

	return closestMatchI;
}

function findClosestStringMatchDict(input, d) {
	let bestMatchKey = null;
	let minDistance = Infinity;

	for (let key in d) {
		let distance = levenshteinDistance(input, d[key]);
		if (distance < minDistance) {
			minDistance = distance;
			bestMatchKey = key;
		}
	}
	return bestMatchKey;
}

function getRandomInt32() {
    return Math.floor(Math.random() * Math.pow(2, 32));
}

function concatenateUint8Arrays(array1, array2) {
    let result = new Uint8Array(array1.length + array2.length);
    result.set(array1);
    result.set(array2, array1.length);
    return result;
}

function validateRadioGroup(name) {
	var isChecked = $("input[name='" + name + "']:checked").length > 0;
	if (!isChecked) {
		console.log("radio group \"" + name + "\" has none checked");
		checkFirstRadioButton(name);
		return false;
	}
	return true;
}

function checkFirstRadioButton(name) {
    $("input[name='" + name + "']:first").prop('checked', true);
}

function isGenericRx(rx) {
	try {
	let product_name = null;
	if (typeof rx === "string") {
		product_name = rx;
	}
	else {
		product_name = rx["product_name"];
	}
	product_name = product_name.toLowerCase();
	if (product_name.includes("generic") == false) {
		return false;
	}
	if (product_name.includes("esp82") == false) {
		return false;
	}
	if (product_name.includes("2.4") == false && product_name.includes("2400") == false) {
		return false;
	}
	if (product_name.includes("rx") == false) {
		return false;
	}
	}
	catch (e) {
		return false;
	}
	return true;
}

function getDateTimeTag() {
	let date = new Date();

	let year = date.getFullYear();
	let month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-based in JavaScript
	let day = ('0' + date.getDate()).slice(-2);
	let hours = ('0' + date.getHours()).slice(-2);
	let minutes = ('0' + date.getMinutes()).slice(-2);
	let seconds = ('0' + date.getSeconds()).slice(-2);

	let timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

	return timestamp;
}