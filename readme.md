# double-metaphone

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

[Double-Metaphone-inspired phonetic analysis for Brazilian Portuguese][source].

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`doubleMetaphone(value)`](#doublemetaphonevalue)
*   [CLI](#cli)
*   [Datasets](#datasets)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [Security](#security)
*   [License](#license)

## What is this?

This package exposes a phonetic algorithm adapted for Brazilian Portuguese.
That means it gets a certain string (typically a Portuguese word), normalizes
Portuguese diacritics and common digraphs, and turns it into codes that can be
compared to other codes to check if they are likely pronounced the same.

## When should I use this?

You’re probably dealing with natural language, and know you need this, if
you’re here!

Use it when you need fuzzy matching, deduplication, or search keys for names and
terms written in Portuguese.  The encoder handles cases such as `ç`, `ch`, `lh`,
`nh`, soft `c`/`g`, common values of `x`, final nasal markers, and common
Brazilian palatalization of `d` and `t`.

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+, 16.0+), install with [npm][]:

```sh
npm install double-metaphone
```

In Deno with [`esm.sh`][esmsh]:

```js
import {doubleMetaphone} from 'https://esm.sh/double-metaphone@2'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {doubleMetaphone} from 'https://esm.sh/double-metaphone@2?bundle'
</script>
```

## Use

```js
import {doubleMetaphone} from 'double-metaphone'

doubleMetaphone('coração') // => ['KRS', 'KRS']
doubleMetaphone('queijo') // => ['KJ', 'KJ']
doubleMetaphone('cidade') // => ['STJ', 'STT']
doubleMetaphone('chave') // => ['XF', 'XF']
doubleMetaphone('exame') // => ['AZM', 'ASM']
doubleMetaphone('Brasil') // => ['PRZU', 'PRSL']
```

## API

This package exports the identifier `doubleMetaphone`.
There is no default export.

### `doubleMetaphone(value)`

Get the Portuguese phonetic codes from a given value.

###### `value`

Value to use (`string`, required).

##### Returns

Portuguese phonetic codes for `value` (`[string, string]`).

## CLI

```txt
Usage: double-metaphone [options] <words...>

Portuguese phonetic analysis

Options:

  -h, --help           output usage information
  -v, --version        output version number

Usage:

# output phonetics
$ double-metaphone coração
# KRS KRS

# output phonetics from stdin
$ echo 'queijo' | double-metaphone
# KJ  KJ

# multiple Portuguese words
$ echo 'cidade coração' | double-metaphone
# STJ STT KRS KRS
```

## Datasets

The repository includes two curated datasets for evaluating Portuguese fuzzy
matching behavior.  For a detailed explanation of the implemented phonetic
rules, see [Fonética em português brasileiro](FONETICA-pt-br.md).

*   [`datasets/transcription-errors.json`](datasets/transcription-errors.json)
    contains 50 likely audio transcription mistakes or consonant swaps that the
    current encoder can match by at least one generated code.
*   [`datasets/algorithm-misses.json`](datasets/algorithm-misses.json) contains
    misspelled words that currently do not share any generated code with the
    intended word.  Use this dataset as a false-negative backlog for future
    algorithm improvements.

## Types

This package is fully typed with [TypeScript][].
It exports no additional types.

## Compatibility

This package is at least compatible with all maintained versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
It also works in Deno and modern browsers.

## Related

*   [`metaphone`](https://github.com/words/metaphone)
    — metaphone algorithm
*   [`soundex-code`](https://github.com/words/soundex-code)
    — soundex algorithm
*   [`stemmer`](https://github.com/words/stemmer)
    — porter stemmer algorithm
*   [`dice-coefficient`](https://github.com/words/dice-coefficient)
    — sørensen–dice coefficient
*   [`levenshtein-edit-distance`](https://github.com/words/levenshtein-edit-distance)
    — levenshtein edit distance
*   [`syllable`](https://github.com/words/syllable)
    — syllable count of English words

## Contribute

Yes please!
See [How to Contribute to Open Source][contribute].

## Security

This package is safe.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/words/double-metaphone/workflows/main/badge.svg

[build]: https://github.com/words/double-metaphone/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/words/double-metaphone.svg

[coverage]: https://codecov.io/github/words/double-metaphone

[downloads-badge]: https://img.shields.io/npm/dm/double-metaphone.svg

[downloads]: https://www.npmjs.com/package/double-metaphone

[size-badge]: https://img.shields.io/bundlephobia/minzip/double-metaphone.svg

[size]: https://bundlephobia.com/result?p=double-metaphone

[npm]: https://www.npmjs.com

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[contribute]: https://opensource.guide/how-to-contribute/

[license]: license

[author]: https://wooorm.com

[source]: https://en.wikipedia.org/wiki/metaphone
