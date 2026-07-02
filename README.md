# DMOL — Discriminação Mnêmica de Objeto-em-Lugar

Teste neurocognitivo digital **breve, multiplataforma e offline** de memória hipocampo-dependente, voltado ao rastreio de **comprometimento cognitivo leve (CCL)** e de estágios **pré-demenciais da doença de Alzheimer (DA)**.

O aplicativo é uma **PWA** (Progressive Web App) autocontida: HTML/CSS/JavaScript puro, sem servidor, sem dependências externas e sem coleta remota de dados. Roda em desktop, tablet e smartphone, e pode ser instalado como app.

> ⚠️ **Aviso.** Este é um **protótipo de pesquisa**. Não é um dispositivo médico, não realiza diagnóstico e não substitui avaliação clínica. Qualquer uso com participantes humanos exige consentimento informado e aprovação ética (CEP).

---

## Índice

- [Fundamentação](#fundamentação)
- [O que o teste mede](#o-que-o-teste-mede)
- [Fluxo do teste](#fluxo-do-teste)
- [Estímulos (geração procedural)](#estímulos-geração-procedural)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como executar localmente](#como-executar-localmente)
- [Publicar no GitHub Pages](#publicar-no-github-pages)
- [Configuração (`CONFIG`)](#configuração-config)
- [Dados exportados](#dados-exportados)
- [Escoragem](#escoragem)
- [Análise em R](#análise-em-r)
- [Limitações e avisos](#limitações-e-avisos)
- [Roadmap](#roadmap)
- [Como citar](#como-citar)
- [Licença](#licença)

---

## Fundamentação

A patologia da DA começa no **córtex entorrinal** e no **hipocampo** antes de atingir o neocórtex. Por isso, os marcadores cognitivos mais precoces refletem **computações específicas do circuito hipocampo-entorrinal**, e não a quantidade bruta de itens recordados.

O DMOL extrai **dois índices ortogonais** de uma **única fase de codificação**, o que mantém o teste curto:

| Índice | Processo cognitivo | Substrato hipotético | Paradigma de origem |
|---|---|---|---|
| **LDI** | Separação de padrões | Giro denteado / CA3 | Mnemonic Similarity Task |
| **BND** | Ligação associativa objeto–lugar | CA1 / subículo / hipocampo | Object-in-Place / Paired-Associate Learning |

Princípio transversal: **os desfechos primários são índices derivados que subtraem processos não-hipocampais** — o LDI usa os distratores (*foils*) para remover o viés de resposta; o BND é condicionado ao reconhecimento correto do item, isolando a ligação para além da memória de item.

---

## O que o teste mede

**Índices primários**

- **LDI** (Lure Discrimination Index) — separação de padrões
  `LDI = p("parecido" | isca) − p("parecido" | novo)`
- **REC** (Recognition Index) — reconhecimento de item (contraste, tende a ser poupado)
  `REC = p("vi este" | alvo) − p("vi este" | novo)`
- **BND exato** — proporção de acertos exatos de célula na tarefa objeto-lugar
- **BND condicional** — BND exato calculado **apenas** sobre itens reconhecidos como "vi este" (ligação pura)
- **Erro de lugar** — distância euclidiana média (em células) entre a célula escolhida e a correta

**Índices secundários**

- **Curva `p("parecido")` por bin de similaridade** — estima o limiar de separação
- **d′ relacional** (bloco opcional) — detecção de troca de posições entre objetos
- **Acurácia e TR do distrator** — velocidade de processamento (covariável)
- **Tempos de resposta** por fase

---

## Fluxo do teste

Duração ~7–10 minutos, sessão única. Uma máquina de estados controla as fases:

1. **Tela inicial** — identificação do participante, forma (A/B/C) e bloco relacional opcional.
2. **Instruções + prática** — 3 objetos, com feedback (única etapa com feedback).
3. **Codificação incidental** — 24 objetos, um por vez, cada um numa célula da grade (2500 ms + ISI 500 ms). Julgamento incidental ("Onde você encontraria este objeto? Dentro/fora de casa" — o clássico do MST; no fallback procedural vira "arredondado ou pontudo?") força processamento profundo e disfarça o objetivo mnêmico. **A posição não é anunciada como testável** (codificação incidental do vínculo objeto–lugar).
4. **Distrator** — comparação de magnitude numérica por ~45 s (esvazia a memória de trabalho).
5. **Discriminação de item** — 36 tentativas ("Vi este / Parecido / Novo"), com atalhos de teclado `1/2/3` → **LDI, REC**.
6. **Objeto-lugar** — os objetos-alvo reaparecem e o participante toca a célula onde estavam → **BND**.
7. **Troca relacional** *(opcional)* — mini-cenas com 2 objetos; metade com posições trocadas ("estava assim?") → **d′ relacional**.
8. **Resultados** — índices calculados na hora + exportação (JSON/CSV).

---

## Estímulos

O app usa, por padrão, um **banco de imagens fotográficas padronizadas** e recorre a **estímulos procedurais** apenas como *fallback* (quando o banco não pode ser lido — p.ex. abrindo o arquivo direto por `file://`).

### Banco fotográfico (padrão): Mnemonic Similarity Task (MST)

O coração do LDI são **iscas com similaridade graduada**. Elas vêm do conjunto **Set 1 do MST** (lab. Craig Stark, UC Irvine), em que cada objeto tem **dois exemplares perceptualmente semelhantes** (`NNNa.jpg` = estudo/alvo; `NNNb.jpg` = isca) e um **lure bin** empírico (1–5; bin 5 = quase idêntico/difícil, bin 1 = bem diferente). Estão inclusos os **128 pares com bin calibrado**, distribuídos pelos cinco níveis; as iscas de cada sessão são **sorteadas de forma estratificada** para cobrir os cinco bins. Ver [`stimuli/ATTRIBUTION.md`](stimuli/ATTRIBUTION.md) para fonte, licença e citação.

O banco é declarado em `stimuli/manifest.json`:

```json
{ "version": 1, "n_pairs": 128,
  "pairs": [ { "id": "002", "a": "objects/002a.jpg", "b": "objects/002b.jpg", "bin": 5 } ] }
```

Para trocar por outro banco (p.ex. imagens locais calibradas), basta repor as imagens em `stimuli/objects/` e reescrever o `manifest.json` — nenhum código precisa mudar.

### Fallback procedural

Sem o banco, os estímulos são **gerados por computador**: cada objeto é um vetor de features (silhueta *blob* de 9 raios, matiz, saturação, luminosidade, textura, rotação). A isca é uma **perturbação de magnitude controlada** desse vetor, definida pelo **bin de similaridade** ([`CONFIG.binAmount`](#configuração-config)).

Vantagens desta abordagem para um protótipo:

- similaridade **calibrável e reprodutível**, sem depender de fotos externas;
- app **100% offline e autocontido**;
- o mecanismo de separação de padrões funciona de verdade já na v1.

**Desvios em relação à especificação de projeto** (todos ajustáveis em [`CONFIG`](#configuração-config)):

- grade **4×6 = 24 células** (em vez de 5×3 = 15), para caber 24 objetos em posições únicas;
- **12 alvos / 12 iscas / 12 novos** (em vez de 16/16/16), mantendo consistência entre nº codificado e nº testado;
- julgamento incidental "dentro/fora de casa" (canônico do MST) com objetos reais; no fallback procedural, tarefa perceptual "arredondado/pontudo", já que os estímulos são abstratos.

---

## Estrutura do projeto

```
.
├── index.html               # app completo (motor do paradigma, estímulos, timing, escoragem, export)
├── manifest.webmanifest     # metadados da PWA (nome, ícones, tema)
├── sw.js                    # service worker (cache-first para uso offline; precache dos estímulos)
├── .nojekyll                # desliga o processamento Jekyll no GitHub Pages
├── stimuli/                 # banco fotográfico (MST) usado por padrão
│   ├── manifest.json        # pares alvo–isca + lure bin (1–5) de cada par
│   ├── ATTRIBUTION.md       # fonte, licença e citação dos estímulos
│   └── objects/             # 001a.jpg / 001b.jpg … (128 pares, 400×400)
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon-maskable-512.png
```

Todo o código-fonte relevante está em **`index.html`**, organizado em blocos comentados: `CONFIG`, utilitários, estímulos procedurais, estado da sessão, telas, fases, escoragem e exportação.

---

## Como executar localmente

**Modo rápido (teste imediato):** abra o `index.html` direto no navegador. Todo o paradigma roda sem servidor.
*Observação:* por `file://`, o service worker e a instalação como app não ativam **e o banco de imagens não carrega** (o navegador bloqueia o `fetch` de arquivos locais) — nesse caso o teste roda com os **estímulos procedurais** de fallback. Para usar as imagens reais, sirva por HTTP (abaixo).

**Modo PWA (offline + instalável):** sirva a pasta por HTTP:

```bash
# na pasta do projeto
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Servido por HTTP(S), o service worker registra e o navegador oferece a opção de instalar.

---

## Publicar no GitHub Pages

O app já usa **caminhos relativos** e não contém sintaxe que o Jekyll processe, então funciona em qualquer subpasta do Pages.

1. Crie um repositório e envie o **conteúdo** deste projeto para a raiz (ou para uma pasta `docs/`).
2. **Settings → Pages**.
3. Em **Source**, selecione **Deploy from a branch**, a branch (`main`) e a pasta **`/ (root)`** (ou **`/docs`**). Salve.
4. Aguarde ~1 min e acesse `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Como o Pages serve por **HTTPS**, service worker e instalação funcionam.

> **Atualizações e cache.** O service worker guarda os arquivos em cache. Ao publicar mudanças, **incremente a versão do cache** em `sw.js` (`const CACHE = 'dmol-v1'` → `'dmol-v2'`, …), senão o navegador pode continuar servindo a versão antiga. Alternativamente, em DevTools → Application → Service Workers → *Unregister*.

---

## Configuração (`CONFIG`)

Todos os parâmetros ficam no objeto `CONFIG`, no topo do `<script>` em `index.html`:

| Chave | Padrão | Descrição |
|---|---|---|
| `cols`, `rows` | `4`, `6` | Dimensões da grade (nº de células = `cols × rows`) |
| `encodeMs` | `2500` | Duração de exibição de cada objeto na codificação (ms) |
| `isiMs` | `500` | Intervalo entre estímulos na codificação (ms) |
| `nTargets` | `12` | Itens repetidos idênticos (viram alvos no teste e no objeto-lugar) |
| `nLures` | `12` | Itens estudados reapresentados como isca semelhante |
| `nFoils` | `12` | Objetos novos (distratores) |
| `distractorMs` | `45000` | Duração da tarefa distratora (ms) |
| `practiceN` | `3` | Nº de objetos na prática |
| `poolSize` | `60` | Tamanho do banco de objetos gerados |
| `binAmount` | `{5:.08, 4:.15, 3:.24, 2:.34, 1:.46}` | Mapeia bin → magnitude de perturbação da isca (menor = mais parecido) |
| `enableRelational` | `false` | Ativa o bloco relacional (também marcável na tela inicial) |
| `relationalTrials` | `6` | Nº de tentativas do bloco relacional |
| `interTrialMs` | `350` | Intervalo entre tentativas nos testes |

Restrição: `nTargets + nLures` (itens codificados) deve ser ≤ `cols × rows` e ≤ `poolSize`.

---

## Dados exportados

**Nenhum dado sai do dispositivo.** A sessão é mantida em memória e o pesquisador a exporta ao final, em **JSON** (completo) ou **CSV** (por tentativa). Um aviso impede a saída acidental da página durante o teste.

### JSON

Estrutura de nível superior:

```json
{
  "meta":    { "participant_id": "...", "session_id": "...", "form": "A",
               "seed": 123, "started": "...", "finished": "...",
               "device": { "type": "...", "input": "touch", "viewport": [w,h], "dpr": 2 },
               "config": { }, "enableRelational": false },
  "scores":  { "LDI": 0.42, "REC": 0.71, "BND_exact": 0.58, "BND_cond": 0.66,
               "BND_error": 1.9, "relD": null, "binRows": [ ] },
  "trials":  [ ],
  "stimuli": { "cellOf": { }, "targetItems": [ ], "lureItems": [ ], "foilIdx": [ ], "pool": [ ] }
}
```

Exemplos de registro por fase (`trials[]`):

```json
{ "phase": "encoding", "objIndex": 12, "cell": 7, "roundness": 0.031,
  "response": "round", "rt": 842.3, "onset": 183422.6, "t": 184901.1 }

{ "phase": "item", "role": "lure", "objIndex": 12, "sim_bin": 4,
  "choice": "similar", "rt": 1478.5, "onset": 190001.2, "t": 191479.7 }

{ "phase": "object_place", "objIndex": 12, "chosen_cell": 6, "true_cell": 7,
  "cell_correct": false, "grid_distance": 1.0, "rt": 2210.4 }
```

O bloco `stimuli` inclui os parâmetros de todos os objetos (`pool`) e o mapeamento objeto→célula (`cellOf`), tornando a sessão **totalmente reprodutível**.

### CSV

Uma linha por tentativa, com as colunas:

```
participant_id, session_id, form, phase, role, objIndex, sim_bin, choice,
response, response_intact, intact, correct, cell, chosen_cell, true_cell,
cell_correct, grid_distance, a, b, roundness, rt, onset, t
```

---

## Escoragem

Calculada no cliente ao final da sessão (função `scoreSession`):

| Índice | Definição |
|---|---|
| `LDI` | `p("similar" \| lure) − p("similar" \| foil)` |
| `REC` | `p("old" \| target) − p("old" \| foil)` |
| `BND_exact` | média de `cell_correct` nas tentativas de objeto-lugar |
| `BND_cond` | `BND_exact` restrito a itens reconhecidos como "vi este" |
| `BND_error` | média de `grid_distance` |
| `binRows` | `p("similar")` por bin de similaridade (curva de separação) |
| `relD` | `z(taxa de acerto) − z(alarme falso)` no bloco relacional |

---

## Análise em R

Os arquivos exportados alimentam diretamente um pipeline em R. Esqueleto sugerido:

```r
library(dplyr); library(pROC)

trials <- readr::read_csv("dmol_P001_A_xxxxxxxx.csv")

item <- trials %>% filter(phase == "item")
p <- function(role, ch) mean(item$choice[item$role == role] == ch)
LDI <- p("lure","similar") - p("foil","similar")
REC <- p("target","old")   - p("foil","old")

# curva LDI × bin (limiar de separação)
item %>% filter(role == "lure") %>%
  group_by(sim_bin) %>% summarise(p_sim = mean(choice == "similar"))

# discriminação diagnóstica (requer rótulo de grupo)
# roc_ldi <- roc(labels$group, scores$LDI); auc(roc_ldi)
```

Para curvas de esquecimento ou modelos mistos, acrescente `lme4`; para psicometria/TRI, `psych`/`mirt`.

---

## Limitações e avisos

- **Não é dispositivo médico** nem ferramenta diagnóstica; é um instrumento de pesquisa em desenvolvimento.
- **Sem normatização**: os escores são **brutos**, sem correção por idade, escolaridade, sexo ou dispositivo.
- **Estímulos paramétricos**: úteis para prototipagem, mas **os bins de similaridade precisam de calibração empírica local** para o limiar de separação ter significado; os cortes/AUCs precisam ser derivados na população-alvo.
- **Formas A/B/C** atualmente variam apenas a semente de geração, não conjuntos calibrados independentes.
- **Privacidade**: os dados existem apenas na memória do navegador até a exportação. Não colete dados identificáveis sem consentimento e aprovação ética.

---

## Roadmap

- [ ] Modo de **calibração** dos bins de similaridade a partir de respostas-piloto
- [x] **Carregador de imagens reais** (pares por bin) — banco MST acoplado; procedural vira *fallback*
- [ ] **Persistência local** (IndexedDB) e sincronização opcional com backend
- [ ] **Normatização** por idade/escolaridade e cálculo de escores-z
- [ ] Conjuntos **A/B/C calibrados** e equivalentes para reteste
- [ ] **Script R** completo (escoragem + ROC + relatório) consumindo o JSON/CSV

---

## Como citar

Se este software for útil em trabalho acadêmico, por favor cite:

```
[Autor(es)]. DMOL — Discriminação Mnêmica de Objeto-em-Lugar:
teste digital de memória hipocampo-dependente. [Ano]. Software.
Disponível em: https://github.com/USUARIO/REPOSITORIO
```

*(Preencha autoria, ano e ORCID/DOI conforme aplicável — ex.: via arquivo `CITATION.cff` do GitHub.)*

---

## Licença

Defina uma licença antes de tornar o repositório público (ex.: **MIT** para uso amplo, ou uma licença mais restritiva para uso acadêmico). Adicione um arquivo `LICENSE` na raiz e referencie-o aqui.

---

*Feito com HTML/CSS/JavaScript puro. Sem frameworks, sem dependências, sem rastreadores.*
