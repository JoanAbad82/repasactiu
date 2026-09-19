# Auditoría integral de contenido — 2026-09-19

## Resultado

**REPASACTIU_FULL_CONTENT_QUALITY_AUDIT=PASS**

La auditoría se inició tras detectar que `b1-042` era válida como pregunta de test con opciones, pero no era autosuficiente como flashcard. La revisión se amplió al contenido pedagógico publicado y al contrato técnico que transforma preguntas de test en tarjetas de memoria.

## Alcance auditado

- 596 preguntas canónicas en catalán.
- 596 traducciones al castellano.
- 596 respuestas correctas y explicaciones.
- 596 ayudas mnemotécnicas bilingües.
- 596 registros de distractores de Examen difícil.
- 42 flashcards extra bilingües.
- 638 flashcards publicadas en total.
- 7 PDF docentes autorizados como únicas fuentes académicas.

## Criterios editoriales aplicados

1. **Autosuficiencia:** una flashcard debe entenderse sin ver las opciones ni una pregunta anterior.
2. **Especificidad:** se evitan referencias vagas como «los dos principios trabajados en el bloque».
3. **Respuesta inequívoca:** la respuesta correcta debe ser la única defendible dentro del material docente.
4. **Fidelidad a fuente:** pregunta, respuesta y explicación se mantienen dentro del contenido de los PDF autorizados.
5. **Bilingüismo semántico:** catalán y castellano conservan la misma pregunta y la misma respuesta académica.
6. **Mnemotecnia segura:** la ayuda de memoria no debe introducir reglas falsas ni excepciones no presentes en el material.
7. **Distractores plausibles pero falsos:** el modo difícil conserva una única respuesta correcta.
8. **Flashcard real:** el frontal debe ser una pregunta completa e interrogativa, no una frase para completar ni una referencia a las opciones.

## Correcciones académicas/editoriales

### b1-042 — Control y responsabilidad

La redacción anterior decía «els dos principis treballats al bloc / los dos principios trabajados en el bloque». Dependía del contexto y resultaba deficiente como tarjeta aislada.

La corrección auditada nombra explícitamente:
- principio de control de la organización;
- principio de responsabilidad.

Se aplica mediante `content_corrections.json` para preservar byte por byte el banco histórico protegido. Se revisaron CA, ES, explicación, mnemotecnia y distractores difíciles.

### b1-049 — Definición de control del Bloque 1

La versión anterior utilizaba una formulación propia del control administrativo del Bloque 2 («comparar con lo previsto / detectar desviaciones»).

Se reescribió con la definición de la fuente del Bloque 1:
- supervisar;
- coordinar;
- organizar las actividades;
- para que el conjunto funcione correctamente.

La trazabilidad especial se corrigió de B2 a B1.

### b2-037 — Capital público/privado

Se conserva la corrección ya certificada que elimina el ejemplo porcentual ambiguo y pregunta por la definición inequívoca de empresa mixta: combinación de capital público y privado.

## Solución estructural para las flashcards

Las 596 tarjetas procedentes de tests ya no están obligadas a reutilizar literalmente el enunciado de opción múltiple.

`buildCoreStudyCards()` admite ahora una capa editorial `coreOverrides` que puede sustituir únicamente, para el modo tarjetas:
- la pregunta;
- opcionalmente la respuesta;
- opcionalmente la mnemotecnia.

El test original, su ID, su respuesta correcta y su lógica de examen permanecen independientes.

Se han creado **59 overrides editoriales** para preguntas que, como flashcard, dependían de opciones, de expresiones como «quina afirmació / qué afirmación», «quina parella / qué pareja», o eran frases incompletas terminadas en puntos suspensivos.

El auditor exige ahora que las 638 tarjetas:
- tengan pregunta efectiva en CA y ES;
- terminen en signo de interrogación;
- no mantengan patrones detectados de dependencia de las opciones;
- tengan respuesta y mnemotecnia válidas;
- conserven cobertura exacta por bloques.

## Flashcards extra

Las 42 tarjetas extra fueron revisadas como contenido independiente y se mantuvo su trazabilidad a los PDF. Se pulieron especialmente cuatro formulaciones para ajustarlas con mayor precisión a la fuente:

- `sc-b1-01`: correo electrónico — eliminado un matiz temporal no expresado en la fuente B1.
- `sc-b1-06`: comercialización — eliminada la secuencia implícita «antes de vender».
- `sc-b4-06`: volumen/complejidad — «puede requerir», evitando presentarlo como consecuencia obligatoria.
- `sc-b5-05`: Comisión Europea — «propone legislación en la mayoría de ámbitos», como indica el material.

## Trazabilidad

`UF0517_SOURCE_TRACEABILITY.json` registra ahora explícitamente las dos correcciones de contenido efectivo:
- `b2-037`;
- `b1-042`.

Además, `b1-049` queda mapeada a la fuente B1, página 10, como corrección de trazabilidad/editorial.

No se ha incorporado conocimiento externo como verdad académica: los PDF del curso siguen siendo la autoridad.

## Evidencia automática

CI funcional #260 sobre `62759bd2823eb583663524d6015d1658f05812b2`:

- `QUESTION_BANK_VALIDATION=PASS`
- `SOURCE_TRACEABILITY=PASS`
- `BILINGUAL_CONTRACT_AUDIT=PASS`
- `CONTENT_QUALITY_AUDIT=PASS`
- `HARD_DISTRACTOR_AUDIT=PASS`
- `STUDY_CARDS_AUDIT=PASS`
- `PERMUTATION_AUDIT=PASS`
- preguntas: 596
- hard records: 596
- core cards: 596
- extra cards: 42
- total cards: 638
- core overrides: 59
- practice permutations: 28.608
- hard permutations: 28.608
- total permutations: **57.216**
- unit tests: **98/98 PASS**
- Playwright E2E: **32/32 PASS**

## Criterio de cierre

No se fusionará esta auditoría mientras el HEAD final no vuelva a pasar la CI completa y el preview no supere un smoke de las tarjetas corregidas, cambio CA/ES y navegación básica.

La auditoría reduce de forma material el riesgo de ambigüedad editorial y añade controles permanentes para evitar la regresión. Como en cualquier material educativo, esto constituye una certificación de alta confianza basada en las fuentes disponibles, no una demostración matemática de ausencia absoluta de futuras mejoras editoriales.
