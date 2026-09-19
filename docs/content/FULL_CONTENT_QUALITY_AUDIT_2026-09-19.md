# Auditoría integral de contenido — 2026-09-19

## Objetivo
Revisar de extremo a extremo el contenido pedagógico de Repàs Actiu después de detectar que una pregunta válida como test podía quedar ambigua al reutilizarse como flashcard.

## Alcance obligatorio
- 596 preguntas canónicas en catalán.
- 596 traducciones al castellano.
- 596 respuestas correctas.
- Explicaciones y ayudas mnemotécnicas bilingües.
- 596 overlays de Examen difícil cuando una corrección de pregunta/respuesta pueda afectar a sus distractores.
- 42 flashcards extra bilingües.
- 638 flashcards generadas en total.

## Criterios editoriales
1. **Autosuficiencia:** la pregunta debe entenderse sin ver las opciones ni una pregunta anterior.
2. **Especificidad:** evitar referencias vagas como «los dos principios trabajados en el bloque».
3. **Respuesta inequívoca:** la respuesta correcta debe ser la única defendible dentro del material docente.
4. **Fidelidad a fuente:** pregunta, respuesta y explicación deben estar respaldadas por el PDF autorizado del bloque.
5. **Bilingüismo semántico:** CA y ES deben preguntar y responder lo mismo.
6. **Mnemotecnia segura:** ayuda a recordar sin introducir una regla falsa o una excepción inexistente.
7. **Distractores plausibles pero falsos:** difíciles sin crear una segunda respuesta defendible.
8. **Flashcard útil:** pregunta y respuesta deben funcionar como unidad aislada de repaso.

## Caso detonante
`b1-042` no cumple autosuficiencia: «els dos principis treballats al bloc / los dos principios trabajados en el bloque» no nombra los dos principios. Debe nombrar explícitamente **control de la organización** y **responsabilidad**.

## Política de cambios
- Corregir contenido, no rebajar auditores.
- Mantener ID, bloque y trazabilidad.
- Si cambia la semántica de un enunciado, revisar CA, ES, explicación, mnemotecnia y hard distractors asociados.
- No fusionar hasta auditoría por los 7 bloques + CI + E2E + smoke visual.
