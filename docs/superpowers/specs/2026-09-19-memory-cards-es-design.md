# Diseño — Tarjetas de Memoria (Español)

## Objetivo
Añadir a Repàs Actiu un juego independiente de memoria educativa en español sin alterar los 596 tests.

## Banco
- 42 parejas nuevas.
- 6 parejas por cada uno de los 7 bloques.
- Cada pareja: término/definición, pregunta/respuesta o categoría/ejemplo.
- Fuente obligatoria: uno de los 7 PDF autorizados del curso.
- El texto de las tarjetas no debe duplicar literalmente preguntas del banco de 596.

## Niveles
- Fácil: 8 parejas / 16 tarjetas / cuadrícula 4 columnas en escritorio.
- Difícil: 18 parejas / 36 tarjetas / cuadrícula 6 columnas en escritorio.
- Selección equilibrada entre los 7 bloques y barajado en cada reinicio.

## Mecánica
- Máximo dos tarjetas levantadas.
- Acierto: quedan visibles, estado verde, sonido y animación.
- Fallo: feedback breve y se ocultan tras 1 segundo.
- Pista: resalta temporalmente una pareja todavía no resuelta; no suma movimiento.
- Final: cronómetro detenido y mensaje con movimientos y tiempo.

## Accesibilidad
- Tarjetas implementadas como botones.
- Enter/Espacio funcionan de forma nativa.
- Focus visible, alto contraste y aria-live.
- Respeto de prefers-reduced-motion.
- Sin dependencia de recursos externos para sonidos.

## Integración
- Nuevo acceso en navegación: Tarjetas de memoria.
- Juego y contenido íntegramente en español aunque la interfaz general esté en catalán.
- Tema claro/oscuro heredado.
- Estado del test y progreso existentes no se modifican.
