# Fonética para português brasileiro

Este documento explica a adaptação fonética implementada neste pacote para
português brasileiro.  A API continua expondo `doubleMetaphone(value)`, mas a
codificação deixou de ser centrada nas regras do inglês e passou a gerar chaves
fonéticas pensadas para buscas, deduplicação e comparação aproximada de palavras
em português.

## Para que serve uma chave fonética?

Uma chave fonética transforma palavras escritas de formas diferentes em códigos
comparáveis.  Em vez de procurar apenas pelo texto exato, a aplicação pode:

1.  gerar o código fonético do termo salvo no índice;
2.  gerar o código fonético do termo digitado, transcrito ou reconhecido por
    áudio;
3.  considerar como candidatos os itens que compartilham o código primário ou o
    código secundário.

Isso ajuda em cenários como:

*   busca por nomes ou documentos com erros de digitação;
*   correção de palavras vindas de reconhecimento de fala;
*   agrupamento de registros duplicados;
*   sugestão de termos quando o usuário troca consoantes com som parecido;
*   triagem de falsos negativos para melhorar o algoritmo.

Por exemplo, a palavra `chave` e a variante `xave` agora geram o mesmo par de
códigos:

```js
import {doubleMetaphone} from 'double-metaphone'

doubleMetaphone('chave') // => ['XF', 'XF']
doubleMetaphone('xave') // => ['XF', 'XF']
```

Como existe interseção entre os códigos, uma busca fonética consegue tratar as
duas formas como candidatas equivalentes.

## O que foi implementado

A implementação atual tem três etapas principais:

### 1. Normalização de entrada

Antes de codificar, o texto é convertido para maiúsculas, diacríticos comuns do
português são dobrados para a vogal base e caracteres que não fazem parte de uma
palavra portuguesa são removidos.  O `Ç` é preservado durante essa etapa porque
ele tem uma regra fonética própria.

Exemplos:

| Entrada   | Forma tratada conceitualmente | Código gerado    |
| --------- | ----------------------------- | ---------------- |
| `coração` | `CORAÇAO`                     | `['KRS', 'KRS']` |
| `AÇÃO`    | `AÇAO`                        | `['AS', 'AS']`   |
| `hábito`  | `HABITO`                      | `['APT', 'APT']` |
| `123-!?`  | vazio                         | `['', '']`       |

### 2. Regras consonantais e dígrafos do português

O codificador percorre a palavra normalizada e aplica regras comuns do português
brasileiro.  Entre elas:

*   `B` e `P` convergem para `P` por serem oclusivas bilabiais próximas.
*   `V` e `F` convergem para `F` para cobrir trocas frequentes de sonoridade.
*   `C` vira `S` antes de `E`/`I`, vira `X` em `CH` e vira `K` nos demais casos.
*   `Ç` vira `S`.
*   `G` vira `J` antes de `E`/`I`, mas `GU` antes de `E`/`I` preserva som de `K`.
*   `J` vira `J`.
*   `LH` é tratado como som lateral e `NH` como som nasal.
*   `M` e `N` finais após vogal são tratados como nasalização e podem não gerar
    uma consoante final.
*   `S` entre vogais gera primário `Z` e secundário `S`, cobrindo diferenças de
    vozeamento.
*   `X` no início ou após nasal pode soar como `X`; entre vogais depois de `E`
    pode soar como `Z`/`S`; em outros contextos pode soar como `KS`.
*   `Z` final vira `S`.
*   `L` final gera primário `U` e secundário `L`, cobrindo a vocalização comum no
    Brasil.
*   `D` e `T` antes de `I` ou `E` final recebem uma leitura primária palatalizada
    (`J`/`X`) e uma secundária conservadora (`T`).

### 3. Código primário e secundário

Assim como no Double Metaphone, a função retorna dois códigos:

```js
doubleMetaphone('cidade') // => ['STJ', 'STT']
doubleMetaphone('noite') // => ['NX', 'NT']
```

O primeiro código representa uma leitura mais provável para português brasileiro.
O segundo mantém uma alternativa útil para sotaques, pronúncias conservadoras ou
transcrições menos fonéticas.  Ao buscar, compare os dois lados:

```js
function shareCode(left, right) {
  return left.some(function (code) {
    return right.includes(code)
  })
}

shareCode(doubleMetaphone('cidade'), doubleMetaphone('sidade')) // => true
```

## Exemplos de uso prático

| Palavra correta | Variante provável | Motivo                               | Códigos da correta   | Códigos da variante  | Encontra? |
| --------------- | ----------------- | ------------------------------------ | -------------------- | -------------------- | --------- |
| `chave`         | `xave`            | `ch` transcrito como `x`             | `['XF', 'XF']`       | `['XF', 'XF']`       | sim       |
| `cheque`        | `xeque`           | `ch` transcrito como `x`             | `['XK', 'XK']`       | `['XK', 'XK']`       | sim       |
| `anexo`         | `anesso`          | `x` com som de `ss`                  | `['ANZ', 'ANS']`     | `['ANS', 'ANS']`     | sim       |
| `exame`         | `ezame`           | `x` com som de `z`                   | `['AZM', 'ASM']`     | `['AZM', 'AZM']`     | sim       |
| `horário`       | `orario`          | `h` mudo e perda de acento           | `['ARR', 'ARR']`     | `['ARR', 'ARR']`     | sim       |
| `mensagem`      | `mensajen`        | final nasal transcrito como `n`      | `['MNSJ', 'MNSJ']`   | `['MNSJ', 'MNSJ']`   | sim       |
| `urgência`      | `urjencia`        | `g` antes de `e` transcrito como `j` | `['ARJNS', 'ARJNS']` | `['ARJNS', 'ARJNS']` | sim       |
| `xícara`        | `chicara`         | `x` inicial transcrito como `ch`     | `['XKR', 'XKR']`     | `['XKR', 'XKR']`     | sim       |
| `vacina`        | `facina`          | `v` confundido com `f`               | `['FSN', 'FSN']`     | `['FSN', 'FSN']`     | sim       |
| `aqui`          | `aki`             | `qu` transcrito como `k`             | `['AK', 'AK']`       | `['AK', 'AK']`       | sim       |

## Comparação com a versão anterior

A versão anterior usava regras orientadas ao inglês.  Por isso, alguns pares
foneticamente próximos em português geravam códigos sem interseção e não eram
bons candidatos de busca.  A tabela abaixo mostra casos que agora passam a ser
encontrados.

| Caso                    | Antes: palavra correta | Antes: variante      | Encontrava antes? | Agora: palavra correta | Agora: variante      | Encontra agora? |
| ----------------------- | ---------------------- | -------------------- | ----------------- | ---------------------- | -------------------- | --------------- |
| `anexo` / `anesso`      | `['ANKS', 'ANKS']`     | `['ANS', 'ANS']`     | não               | `['ANZ', 'ANS']`       | `['ANS', 'ANS']`     | sim             |
| `chave` / `xave`        | `['XF', 'XF']`         | `['SF', 'SF']`       | não               | `['XF', 'XF']`         | `['XF', 'XF']`       | sim             |
| `cheque` / `xeque`      | `['XK', 'XK']`         | `['SK', 'SK']`       | não               | `['XK', 'XK']`         | `['XK', 'XK']`       | sim             |
| `crédito` / `credtio`   | `['KRTT', 'KRTT']`     | `['KRT', 'KRT']`     | não               | `['KRJT', 'KRTT']`     | `['KRTX', 'KRTT']`   | sim             |
| `exame` / `ezame`       | `['AKSM', 'AKSM']`     | `['ASM', 'ASM']`     | não               | `['AZM', 'ASM']`       | `['AZM', 'AZM']`     | sim             |
| `garagem` / `garaje`    | `['KRJM', 'KRKM']`     | `['KRJ', 'KRJ']`     | não               | `['KRJ', 'KRJ']`       | `['KRJ', 'KRJ']`     | sim             |
| `horário` / `orario`    | `['HRR', 'HRR']`       | `['ARR', 'ARR']`     | não               | `['ARR', 'ARR']`       | `['ARR', 'ARR']`     | sim             |
| `mensagem` / `mensajen` | `['MNSJM', 'MNSKM']`   | `['MNSJN', 'MNSJN']` | não               | `['MNSJ', 'MNSJ']`     | `['MNSJ', 'MNSJ']`   | sim             |
| `urgência` / `urjencia` | `['ARKNS', 'ARKNS']`   | `['ARJNS', 'ARJNS']` | não               | `['ARJNS', 'ARJNS']`   | `['ARJNS', 'ARJNS']` | sim             |
| `xícara` / `chicara`    | `['SKR', 'SKR']`       | `['XKR', 'XKR']`     | não               | `['XKR', 'XKR']`       | `['XKR', 'XKR']`     | sim             |

Esses exemplos foram escolhidos porque representam problemas comuns em
português brasileiro: `ch`/`x`, `g`/`j`, `x` com sons diferentes, `h` mudo,
final nasal e perda de acento.

## Datasets de avaliação

O repositório inclui dois datasets para testar e evoluir a implementação:

*   [`datasets/transcription-errors.json`](datasets/transcription-errors.json)
    contém 50 erros prováveis de transcrição de áudio ou troca de consoantes que a
    versão atual já consegue encontrar por interseção de código fonético.
*   [`datasets/algorithm-misses.json`](datasets/algorithm-misses.json) contém
    palavras erradas que ainda não compartilham código com a forma correta.  Esse
    arquivo funciona como backlog de falsos negativos.

Um fluxo simples para usar o primeiro dataset em uma avaliação é:

```js
import fs from 'node:fs'
import {doubleMetaphone} from './index.js'

const dataset = JSON.parse(fs.readFileSync('datasets/transcription-errors.json'))

for (const entry of dataset) {
  const correct = doubleMetaphone(entry.correct)
  const variant = doubleMetaphone(entry.variant)
  const found = correct.some(function (code) {
    return variant.includes(code)
  })

  console.log(entry.correct, entry.variant, found)
}
```

## Limitações conhecidas

A codificação fonética não substitui distância de edição, ranking textual,
dicionário léxico ou análise semântica.  Ela é uma etapa barata para gerar
candidatos.  Depois dela, recomenda-se ordenar os candidatos por critérios
adicionais, como frequência, distância de Levenshtein, similaridade de tokens ou
contexto da aplicação.

O dataset de falhas documentadas mostra casos que ainda precisam de regras
melhores.  Exemplos atuais incluem `arquivo` / `arquibo`, `filho` / `fio`,
`guia` / `gia`, `maçã` / `maca` e `próximo` / `prossimo`.
