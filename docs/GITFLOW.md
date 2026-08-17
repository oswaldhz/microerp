# GitFlow — MicroERP

Convención de ramas y flujo de trabajo del repositorio.

## Ramas

| Rama            | Propósito                        | Protegida |
| --------------- | -------------------------------- | --------- |
| `main`          | Producción (estable, desplegable) | Sí        |
| `develop`       | Integración (donde se junta todo) | Sí        |
| `feature/*`     | Funcionalidades nuevas            | No        |
| `hotfix/*`      | Correcciones urgentes de `main`   | No        |
| `release/v*`    | Preparación de una versión        | No        |

`main` y `develop` solo aceptan cambios vía **Pull Request** (sin push directo).
No se exigen aprobaciones: tú mergeas tus propios PRs.

## Flujo

### Nueva funcionalidad

```bash
git checkout develop
git checkout -b feature/mi-cambio
# ... trabajo ...
git add -A
git commit -m "feat: resumen breve del cambio"
git push -u origin feature/mi-cambio
gh pr create --base develop --fill
gh pr merge --merge --delete-branch
```

### Corrección urgente (producción rota)

```bash
git checkout main
git checkout -b hotfix/arreglo-critico
# ... trabajo ...
git push -u origin hotfix/arreglo-critico
gh pr create --base main --fill
gh pr merge --merge --delete-branch
# y después mergea main → develop para no perder el fix
git checkout develop && git merge main && git push
```

### Versión lista

```bash
git checkout develop
git checkout -b release/v1.0
# ajustes finales (versión, docs)
git push -u origin release/v1.0
gh pr create --base main --fill
gh pr merge --merge --delete-branch
git checkout develop && git merge main && git push   # vuelve a develop
```

## Convenciones de commits

- Español, presente de indicativo, estilo convencional corto:
  `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Ejemplos: `feat: crud de clientes`, `fix: tooltips recortados en la sidebar`, `docs: actualiza la guia completa`

## Reglas

- Una feature por rama; PRs pequeños y revisables.
- `develop` siempre debe compilar: corre `npm run build` y los tests antes de mergear.
- Nunca commitear `.env` ni secretos (ya está en `.gitignore`).