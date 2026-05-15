// Match Portuguese vowels after accent folding.
const vowels = /[AEIOU]/

// Match characters that may belong to a Portuguese word.
const wordCharacters = /[^A-ZÇ]/g

// Fold Portuguese diacritics while keeping Ç, which has its own sound.
const accentMap = new Map([
  ['Á', 'A'],
  ['À', 'A'],
  ['Â', 'A'],
  ['Ã', 'A'],
  ['Ä', 'A'],
  ['É', 'E'],
  ['È', 'E'],
  ['Ê', 'E'],
  ['Ë', 'E'],
  ['Í', 'I'],
  ['Ì', 'I'],
  ['Î', 'I'],
  ['Ï', 'I'],
  ['Ó', 'O'],
  ['Ò', 'O'],
  ['Ô', 'O'],
  ['Õ', 'O'],
  ['Ö', 'O'],
  ['Ú', 'U'],
  ['Ù', 'U'],
  ['Û', 'U'],
  ['Ü', 'U']
])

/**
 * Get the phonetics according to a Double-Metaphone-inspired algorithm adapted
 * for Brazilian Portuguese.
 *
 * @param {string} value
 *   Value to use.
 * @returns {[string, string]}
 *   Portuguese phonetic codes for `value`.
 */
export function doubleMetaphone(value) {
  const normalized = normalizePortuguese(value)

  if (!normalized) {
    return ['', '']
  }

  return encodePortuguese(normalized)
}

/**
 * Normalize Portuguese text to the small alphabet used by the encoder.
 *
 * @param {string} value
 *   Value to normalize.
 * @returns {string}
 *   Normalized value.
 */
function normalizePortuguese(value) {
  let result = ''
  const upper = String(value).toUpperCase()
  let index = -1

  while (++index < upper.length) {
    const character = upper.charAt(index)
    result += accentMap.get(character) || character
  }

  return result.replace(wordCharacters, '')
}

/**
 * Encode one normalized Portuguese word.
 *
 * @param {string} value
 *   Normalized value.
 * @returns {[string, string]}
 *   Phonetic codes.
 */
// eslint-disable-next-line complexity
function encodePortuguese(value) {
  let primary = ''
  let secondary = ''
  let index = 0
  const length = value.length
  const last = length - 1

  while (index < length) {
    const character = value.charAt(index)
    const previous = value.charAt(index - 1)
    const next = value.charAt(index + 1)
    const nextnext = value.charAt(index + 2)

    switch (character) {
      case 'A':
      case 'E':
      case 'I':
      case 'O':
      case 'U': {
        if (index === 0 || (index === 1 && value.charAt(0) === 'H')) {
          primary += 'A'
          secondary += 'A'
        }

        index++
        break
      }

      case 'B':
      case 'P': {
        primary += 'P'
        secondary += 'P'
        index += next === character ? 2 : 1
        break
      }

      case 'C': {
        if (next === 'H') {
          primary += 'X'
          secondary += 'X'
          index += 2
        } else if (next === 'C' && (nextnext === 'E' || nextnext === 'I')) {
          primary += 'KS'
          secondary += 'KS'
          index += 2
        } else if (next === 'E' || next === 'I') {
          primary += 'S'
          secondary += 'S'
          index++
        } else {
          primary += 'K'
          secondary += 'K'
          index += next === 'C' ? 2 : 1
        }

        break
      }

      case 'Ç': {
        primary += 'S'
        secondary += 'S'
        index++
        break
      }

      case 'D': {
        if (isPalatalVowel(next, index, last)) {
          primary += 'J'
          secondary += 'T'
        } else {
          primary += 'T'
          secondary += 'T'
        }

        index += next === 'D' ? 2 : 1
        break
      }

      case 'F':
      case 'V': {
        primary += 'F'
        secondary += 'F'
        index += next === character ? 2 : 1
        break
      }

      case 'G': {
        if (next === 'U' && (nextnext === 'E' || nextnext === 'I')) {
          primary += 'K'
          secondary += 'K'
          index += 2
        } else if (next === 'E' || next === 'I') {
          primary += 'J'
          secondary += 'J'
          index++
        } else {
          primary += 'K'
          secondary += 'K'
          index += next === 'G' ? 2 : 1
        }

        break
      }

      case 'H': {
        index++
        break
      }

      case 'J': {
        primary += 'J'
        secondary += 'J'
        index += next === 'J' ? 2 : 1
        break
      }

      case 'K':
      case 'Q': {
        primary += 'K'
        secondary += 'K'
        index += next === character || next === 'U' ? 2 : 1
        break
      }

      case 'L': {
        if (next === 'H') {
          primary += 'L'
          secondary += 'L'
          index += 2
        } else if (index === last) {
          primary += 'U'
          secondary += 'L'
          index++
        } else {
          primary += 'L'
          secondary += 'L'
          index += next === 'L' ? 2 : 1
        }

        break
      }

      case 'M': {
        if (index === last && isNasalPrevious(previous)) {
          index++
        } else {
          primary += 'M'
          secondary += 'M'
          index += next === 'M' ? 2 : 1
        }

        break
      }

      case 'N': {
        if (next === 'X' && isNasalPrevious(previous)) {
          index++
        } else if (next === 'H') {
          primary += 'N'
          secondary += 'N'
          index += 2
        } else if (index === last && isNasalPrevious(previous)) {
          index++
        } else {
          primary += 'N'
          secondary += 'N'
          index += next === 'N' ? 2 : 1
        }

        break
      }

      case 'R': {
        primary += 'R'
        secondary += 'R'
        index += next === 'R' ? 2 : 1
        break
      }

      case 'S': {
        if (next === 'H') {
          primary += 'X'
          secondary += 'X'
          index += 2
        } else if (next === 'S') {
          primary += 'S'
          secondary += 'S'
          index += 2
        } else if (next === 'C' && (nextnext === 'E' || nextnext === 'I')) {
          primary += 'S'
          secondary += 'S'
          index += 2
        } else if (isBetweenVowels(previous, next)) {
          primary += 'Z'
          secondary += 'S'
          index++
        } else {
          primary += 'S'
          secondary += 'S'
          index++
        }

        break
      }

      case 'T': {
        if (isPalatalVowel(next, index, last)) {
          primary += 'X'
          secondary += 'T'
        } else {
          primary += 'T'
          secondary += 'T'
        }

        index += next === 'T' ? 2 : 1
        break
      }

      case 'W': {
        if (vowels.test(next) || (index === last && vowels.test(previous))) {
          primary += 'U'
          secondary += 'V'
        }

        index++
        break
      }

      case 'X': {
        if (index === 0 || (previous === 'N' && vowels.test(next))) {
          primary += 'X'
          secondary += 'X'
        } else if (previous === 'E' && vowels.test(next)) {
          primary += 'Z'
          secondary += 'S'
        } else if (next === 'C' && (nextnext === 'E' || nextnext === 'I')) {
          primary += 'S'
          secondary += 'S'
          index += 2
          break
        } else {
          primary += 'KS'
          secondary += 'KS'
        }

        index++
        break
      }

      case 'Y': {
        if (vowels.test(previous) || vowels.test(next)) {
          primary += 'I'
          secondary += 'I'
        }

        index++
        break
      }

      case 'Z': {
        if (index === last) {
          primary += 'S'
          secondary += 'S'
        } else {
          primary += 'Z'
          secondary += 'Z'
        }

        index += next === 'Z' ? 2 : 1
        break
      }

      /* c8 ignore next 3 -- normalization keeps only characters handled above. */
      default: {
        index++
      }
    }
  }

  return [primary, secondary]
}

/**
 * Check whether a D/T may be palatalized in common Brazilian pronunciations.
 *
 * @param {string} next
 *   Following character.
 * @param {number} index
 *   Current index.
 * @param {number} last
 *   Last index.
 * @returns {boolean}
 *   Whether the following vowel is palatalizing.
 */
function isPalatalVowel(next, index, last) {
  return next === 'I' || (next === 'E' && index + 1 === last)
}

/**
 * Check whether a final M/N only marks vowel nasalization.
 *
 * @param {string} previous
 *   Previous character.
 * @returns {boolean}
 *   Whether the previous character is a nasalizable vowel.
 */
function isNasalPrevious(previous) {
  return (
    previous === 'A' || previous === 'E' || previous === 'I' || previous === 'O'
  )
}

/**
 * Check whether a consonant is between vowels.
 *
 * @param {string} previous
 *   Previous character.
 * @param {string} next
 *   Next character.
 * @returns {boolean}
 *   Whether both surrounding characters are vowels.
 */
function isBetweenVowels(previous, next) {
  return vowels.test(previous) && vowels.test(next)
}
