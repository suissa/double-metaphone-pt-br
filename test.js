import assert from 'node:assert/strict'
import util from 'node:util'
import cp from 'node:child_process'
import fs from 'node:fs'
import {URL} from 'node:url'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {doubleMetaphone as m} from './index.js'

const exec = util.promisify(cp.exec)

/** @type {import('type-fest').PackageJson} */
const pack = JSON.parse(
  String(fs.readFileSync(new URL('package.json', import.meta.url)))
)

const transcriptionErrors = readDataset('datasets/transcription-errors.json')
const algorithmMisses = readDataset('datasets/algorithm-misses.json')

/**
 * @typedef DatasetEntry
 * @property {string} correct
 * @property {string} variant
 * @property {string | undefined} [category]
 * @property {string | undefined} [reason]
 * @property {[string, string] | undefined} [correctCodes]
 * @property {[string, string] | undefined} [variantCodes]
 */

/**
 * @param {string} path
 *   Dataset path.
 * @returns {Array<DatasetEntry>}
 *   Dataset entries.
 */
function readDataset(path) {
  return JSON.parse(String(fs.readFileSync(new URL(path, import.meta.url))))
}

/**
 * @param {[string, string]} left
 *   Left phonetic codes.
 * @param {[string, string]} right
 *   Right phonetic codes.
 * @returns {boolean}
 *   Whether at least one code is shared.
 */
function hasSharedCode(left, right) {
  return left.some(function (code) {
    return right.includes(code)
  })
}

test('api: análise fonética para português brasileiro', async function (t) {
  assert.equal(typeof m, 'function', 'should be a `function`')
  assert.deepEqual(m(''), ['', ''], 'should support empty input')
  assert.deepEqual(m('123-!?'), ['', ''], 'should ignore non-word input')

  await t.test('normalização e vogais', function () {
    assert.deepEqual(m('água'), ['AK', 'AK'])
    assert.deepEqual(m('Érico'), ['ARK', 'ARK'])
    assert.deepEqual(m('coração'), ['KRS', 'KRS'])
    assert.deepEqual(m('AÇÃO'), ['AS', 'AS'])
    assert.deepEqual(m('hábito'), ['APT', 'APT'])
  })

  await t.test('consoantes oclusivas e equivalências', function () {
    assert.deepEqual(m('bola'), ['PL', 'PL'])
    assert.deepEqual(m('pato'), ['PT', 'PT'])
    assert.deepEqual(m('atta'), ['AT', 'AT'])
    assert.deepEqual(m('bball'), ['PL', 'PL'])
    assert.deepEqual(m('affo'), ['AF', 'AF'])
    assert.deepEqual(m('avvo'), ['AF', 'AF'])
    assert.deepEqual(m('dado'), ['TT', 'TT'])
    assert.deepEqual(m('addo'), ['AT', 'AT'])
    assert.deepEqual(m('gago'), ['KK', 'KK'])
    assert.deepEqual(m('agglo'), ['AKL', 'AKL'])
    assert.deepEqual(m('kiko'), ['KK', 'KK'])
    assert.deepEqual(m('quero'), ['KR', 'KR'])
    assert.deepEqual(m('Itaquaquecetuba'), ['ATKKSTP', 'ATKKSTP'])
  })

  await t.test('c, ç, ch, g, gu, j, lh e nh', function () {
    assert.deepEqual(m('casa'), ['KZ', 'KS'])
    assert.deepEqual(m('cebola'), ['SPL', 'SPL'])
    assert.deepEqual(m('chave'), ['XF', 'XF'])
    assert.deepEqual(m('acção'), ['AKS', 'AKS'])
    assert.deepEqual(m('accede'), ['AKSJ', 'AKST'])
    assert.deepEqual(m('acci'), ['AKS', 'AKS'])
    assert.deepEqual(m('acco'), ['AK', 'AK'])
    assert.deepEqual(m('açúcar'), ['ASKR', 'ASKR'])
    assert.deepEqual(m('gente'), ['JNX', 'JNT'])
    assert.deepEqual(m('guitarra'), ['KTR', 'KTR'])
    assert.deepEqual(m('jiboia'), ['JP', 'JP'])
    assert.deepEqual(m('jjarro'), ['JR', 'JR'])
    assert.deepEqual(m('filho'), ['FL', 'FL'])
    assert.deepEqual(m('ninho'), ['NN', 'NN'])
  })

  await t.test('palatalização brasileira de d/t', function () {
    assert.deepEqual(m('dia'), ['J', 'T'])
    assert.deepEqual(m('cidade'), ['STJ', 'STT'])
    assert.deepEqual(m('tio'), ['X', 'T'])
    assert.deepEqual(m('noite'), ['NX', 'NT'])
  })

  await t.test('s, x, z e encontros frequentes', function () {
    assert.deepEqual(m('massa'), ['MS', 'MS'])
    assert.deepEqual(m('sapo'), ['SP', 'SP'])
    assert.deepEqual(m('casa'), ['KZ', 'KS'])
    assert.deepEqual(m('nascer'), ['NSR', 'NSR'])
    assert.deepEqual(m('sci'), ['S', 'S'])
    assert.deepEqual(m('xícara'), ['XKR', 'XKR'])
    assert.deepEqual(m('enxame'), ['AXM', 'AXM'])
    assert.deepEqual(m('exame'), ['AZM', 'ASM'])
    assert.deepEqual(m('excelente'), ['ASLNX', 'ASLNT'])
    assert.deepEqual(m('táxi'), ['TKS', 'TKS'])
    assert.deepEqual(m('axci'), ['AS', 'AS'])
    assert.deepEqual(m('zero'), ['ZR', 'ZR'])
    assert.deepEqual(m('luz'), ['LS', 'LS'])
    assert.deepEqual(m('pizza'), ['PZ', 'PZ'])
  })

  await t.test('sons finais, estrangeirismos comuns e duplicadas', function () {
    assert.deepEqual(m('Brasil'), ['PRZU', 'PRSL'])
    assert.deepEqual(m('bom'), ['P', 'P'])
    assert.deepEqual(m('hífen'), ['AF', 'AF'])
    assert.deepEqual(m('show'), ['XU', 'XV'])
    assert.deepEqual(m('yamaha'), ['IM', 'IM'])
    assert.deepEqual(m('toy'), ['TI', 'TI'])
    assert.deepEqual(m('y'), ['', ''])
    assert.deepEqual(m('layout'), ['LIT', 'LIT'])
    assert.deepEqual(m('carro'), ['KR', 'KR'])
    assert.deepEqual(m('Anna'), ['AN', 'AN'])
    assert.deepEqual(m('mamma'), ['MM', 'MM'])
    assert.deepEqual(m('Wagner'), ['UKNR', 'VKNR'])
  })
})

test('cli', async function () {
  assert.deepEqual(
    await exec('./cli.js coração'),
    {stdout: 'KRS\tKRS\n', stderr: ''},
    'one'
  )

  assert.deepEqual(
    await exec('./cli.js queijo cidade'),
    {stdout: 'KJ\tKJ STJ\tSTT\n', stderr: ''},
    'two'
  )

  await new Promise(function (resolve) {
    const input = new PassThrough()
    const subprocess = cp.exec('./cli.js', function (error, stdout, stderr) {
      assert.deepEqual(
        [error, stdout, stderr],
        [null, 'KJ\tKJ STJ\tSTT\n', ''],
        'stdin'
      )
    })
    assert(subprocess.stdin, 'expected stdin on `subprocess`')
    input.pipe(subprocess.stdin)
    input.write('queijo')
    setImmediate(function () {
      input.end(' cidade')
      setImmediate(resolve)
    })
  })

  const h = await exec('./cli.js -h')

  assert.ok(/\sUsage: double-metaphone/.test(h.stdout), '-h')
  assert.match(h.stdout, /coração/, 'help should show a Portuguese example')

  const help = await exec('./cli.js --help')

  assert.ok(/\sUsage: double-metaphone/.test(help.stdout), '-h')

  assert.deepEqual(
    await exec('./cli.js -v'),
    {stdout: pack.version + '\n', stderr: ''},
    '-v'
  )

  assert.deepEqual(
    await exec('./cli.js --version'),
    {stdout: pack.version + '\n', stderr: ''},
    '--version'
  )
})

test('datasets', async function (t) {
  await t.test(
    'transcription errors contains 50 findable variants',
    function () {
      assert.equal(transcriptionErrors.length, 50)

      /** @type {Set<string>} */
      const seen = new Set()

      for (const entry of transcriptionErrors) {
        assert.equal(typeof entry.correct, 'string')
        assert.equal(typeof entry.variant, 'string')
        assert.equal(typeof entry.category, 'string')
        assert.ok(!seen.has(entry.correct + '\0' + entry.variant))
        seen.add(entry.correct + '\0' + entry.variant)
        assert.ok(hasSharedCode(m(entry.correct), m(entry.variant)))
      }
    }
  )

  await t.test(
    'algorithm misses documents current false negatives',
    function () {
      assert.equal(algorithmMisses.length, 32)

      /** @type {Set<string>} */
      const seen = new Set()

      for (const entry of algorithmMisses) {
        const correctCodes = m(entry.correct)
        const variantCodes = m(entry.variant)

        assert.equal(typeof entry.reason, 'string')
        assert.deepEqual(entry.correctCodes, correctCodes)
        assert.deepEqual(entry.variantCodes, variantCodes)
        assert.ok(!seen.has(entry.correct + '\0' + entry.variant))
        seen.add(entry.correct + '\0' + entry.variant)
        assert.equal(hasSharedCode(correctCodes, variantCodes), false)
      }
    }
  )
})
