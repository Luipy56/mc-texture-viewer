# Cursor rules (MDC)

Reglas de proyecto para el agente de Cursor. Se aplican según los `globs` o `alwaysApply` definidos en cada `.mdc`.

## Proyecto: mc-texture-viewer

Visor 3D embebible (Web Component) para modelos tipo Minecraft (GLB/OBJ+MTL), con texturas por defecto y packs por ZIP (hot-swap). Sin backend.

## Reglas actuales

| Archivo | Descripción |
|--------|-------------|
| `mc-texture-viewer-project.mdc` | Contexto del proyecto: nombre, estructura, API, convenciones (siempre aplicada) |
| `three-js-best-practices.mdc` | Three.js: WebGL, assets, rendimiento, dispose, estructura |
| `typescript-best-practices.mdc` | TypeScript: strict, tipos, JSDoc, unknown, type guards |
| `vite-best-practices.mdc` | Vite: config mínima, imports explícitos, Vitest |
| `ui-design.mdc` | UI: toolbar, controles, reset, valores por defecto, accesibilidad |

## Referencia externa

Más reglas por librería (React, Vue, Django, etc.) en:

**[awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc/tree/main/rules-mdc)** — reglas `.mdc` generadas por comunidad (Exa + LLM). Se pueden copiar o inspirar en las de `rules-mdc/` para añadir nuevas reglas aquí.

Formato estándar de cada regla: frontmatter con `description`, `globs` y opcionalmente `alwaysApply`; cuerpo en Markdown con ejemplos ✅/❌.
