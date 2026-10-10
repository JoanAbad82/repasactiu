# Repàs Actiu

[![CI](https://github.com/JoanAbad82/repasactiu/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JoanAbad82/repasactiu/actions/workflows/ci.yml)

Plataforma web pública, bilingüe i gratuïta de suport a l'estudi del curs **Operacions auxiliars de serveis administratius i generals**.

**Web publicada:** https://repasactiu.pages.dev/

> **Avís acadèmic:** Repàs Actiu és una eina informal i no oficial. Els apunts i materials docents oficials són l'autoritat acadèmica; les respostes de la web poden contenir errors.

## Funcionalitats

- Tests per unitat, bloc o conjunt del temari, amb modes Estudi, Examen i Examen difícil.
- Revisió de preguntes fallades, explicacions i ajudes de memòria.
- Targetes de memòria amb resposta i mnemotècnica.
- Diccionari organitzat per famílies de conceptes i llistes clau.
- Exemples pràctics de correspondència, documents administratius, nòmines, tresoreria i UF0519 Unitat 3: material d'oficina i gestió d'existències (11 activitats amb 61 respostes guiades i pressupost d'oficina editable de 21 articles).
- Joc del penjat amb conceptes del curs.
- Interfície en català i castellà, mode clar/fosc i adaptació a dispositius mòbils.
- Progrés i preferències desats al navegador amb `localStorage`; sense comptes ni servidor d'usuari.

Els recomptes vigents de preguntes, targetes i conceptes es deriven dels bancs publicats i es validen automàticament. No es mantenen totals històrics fixos en aquest document.

## Fonts i traçabilitat

1. Els materials oficials del curs prevalen sobre qualsevol correcció o proposta externa.
2. El català és la capa canònica del contingut de test.
3. La traducció castellana conserva els identificadors i els índexs de resposta correcta.
4. Les dades de traçabilitat a `docs/content/` documenten la relació entre materials de referència i contingut.
5. Els validadors comproven estructura, traducció, codificació, cronologia, qualitat editorial i traçabilitat.

**UF0519 · Unitat 3:** les activitats estan traçades al PDF oficial i als quatre fulls DOCX; la plantilla Excel d'oficina s'ha convertit en un exercici amb els mateixos 21 materials. Com que la plantilla no incloïa preus ni ofertes de botigues, els imports i proveïdors de l'activitat són **dades didàctiques simulades**, identificades explícitament i editables. No són cotitzacions reals. Les operacions i respostes es resolen sense calculadores ni fonts externes.

La documentació d'agent `AGENTS.md` i l'estat `PROJECT_STATUS.json` estableixen els límits de producció i recerca. Les propostes de `repasactiu-research-intake` no es publiquen automàticament.

## Desenvolupament reproduïble

Requereix **Node.js 22 o posterior compatible** i les dependències fixades a `package-lock.json`.

```bash
npm ci
npx playwright install chromium
npm run test:all
npm run build
npm run serve
```

- `npm run test:all` executa les auditories de contingut, tests unitaris i proves de navegador.
- `npm run build` crea `dist/` i verifica els recursos essencials.
- `npm run serve` permet executar la web en local.
- El workflow `.github/workflows/ci.yml` executa tests i build en les pull requests i les actualitzacions de `main`.

## Càrrega diferida i mesura

La portada carrega els bancs canònics de preguntes per mostrar blocs, recomptes i progrés. Els bancs de targetes addicionals, diccionari, llistes clau, joc del penjat i exemples pràctics es carreguen **quan s'obre cada eina**, i després es reutilitzen mentre dura la sessió. Si falla la descàrrega, la interfície permet reintentar-la.

Per repetir el mesurament local, executeu `npm run serve` en un terminal i `npm run audit:loading` en un altre. L'script usa Playwright Chromium amb la memòria cau desactivada; genera un JSON de recursos i bytes carregats per pantalla. La mesura de referència i les seves limitacions consten a `docs/performance/on-demand-learning-data-v1.json`. Les mesures locals no equivalen a una prova de Core Web Vitals en producció.

## Estructura

- `site/index.html`: document principal.
- `site/css/`: disseny, avisos i adaptació responsiva.
- `site/js/`: navegació i funcionalitats educatives.
- `site/data/`: continguts canònics i traduccions.
- `scripts/`: generació i validacions.
- `tests/unit/` i `tests/e2e/`: comprovacions automatitzades.
- `docs/content/`: auditories i traçabilitat de fonts.

La web es publica a Cloudflare Pages des de `main` amb `npm run build` i directori de sortida `dist/`. Els canvis han de superar tests i build abans d'integrar-se a `main`.

## Llicència i independència

Repàs Actiu és independent d'Open Utility Lab. El programari original té l'abast de llicència Apache-2.0 descrit a `LICENSE`; el contingut educatiu i derivat de materials docents manté una delimitació de drets diferenciada. Consulteu `LICENSE`, `SECURITY.md` i `CONTRIBUTING.md` abans de reutilitzar contingut o contribuir-hi.
