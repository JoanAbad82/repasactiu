# Repàs Actiu

Plataforma web pública i minimalista de tests en català i castellà.

## V1

Curs inicial: **Operacions auxiliars de serveis administratius i generals**.

- Interfície bilingüe Català / Castellano
- 320 preguntes disponibles en tots dos idiomes
- Traducció completa d’enunciats, opcions i explicacions
- 320 ajudes de memòria bilingües: exemple pràctic o idea breu per recordar
- Mode Estudi
- Mode Examen
- Mode Repassar errors
- Sense comptes ni backend
- Progrés, tema i idioma desats localment amb `localStorage`
- Cloudflare Pages

Producció: https://repasactiu.pages.dev

### Banc de preguntes

El banc es basa exclusivament en els materials docents originals disponibles. Les preguntes incorporen casos d’aplicació, comparació entre conceptes pròxims i distractors del mateix àmbit, mantenint una sola resposta inequívocament correcta.

El català és la versió canònica del contingut. La versió castellana reutilitza els mateixos identificadors de pregunta i el mateix índex de resposta correcta; només tradueix el text de la pregunta, les quatre opcions, el tema i l’explicació. Això evita duplicar la lògica de puntuació o crear divergències entre idiomes.

Cada pregunta incorpora també una ajuda de memòria separada del banc canònic. Prioritza un exemple d’aplicació pràctica i, quan no és natural, una idea concisa per recordar. Cada versió lingüística té un màxim de 144 caràcters. L’ajuda només es mostra després de respondre i també durant la revisió de respostes, de manera que no dona pistes abans de contestar.

Les 200 preguntes publicades anteriorment en català es conserven sense modificacions. L’ampliació afegeix 120 preguntes noves corresponents al Bloc 4 de la Unitat 1 i al Bloc 1 de la Unitat 2.

Distribució actual:

**Unitat 1 — Organització empresarial**

- Bloc 1: 42 preguntes
- Bloc 2: 56 preguntes
- Bloc 3: 56 preguntes
- Bloc 4 — Els departaments: 40 preguntes
- Bloc 5: 46 preguntes

**Unitat 2 — L’organització dels recursos humans**

- Bloc 1 — L’organització d’activitats de suport administratiu: 80 preguntes

**Total: 320 preguntes en català + 320 traduccions completes al castellà + 320 ajudes de memòria bilingües.**

## Desenvolupament

Requereix Node.js 22 LTS.

```powershell
npm install
npm run test
npm run serve
```

La validació automàtica comprova els 320 registres canònics, la cobertura exacta de les 320 traduccions castellanes i les 320 ajudes de memòria en tots dos idiomes. També verifica que cada ajuda sigui `example` o `idea`, que no sigui buida i que no superi els 144 caràcters.

## Independència

Repàs Actiu és un projecte independent d’Open Utility Lab.
