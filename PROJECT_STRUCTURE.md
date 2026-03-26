# Estructura del Proyecto - Sinergy ERP Backend

## Organización General

```
sinergy-erp-backend-clients/
├── src/                          # Código fuente principal
│   ├── api/                      # Módulos de API (contracts, leads, etc.)
│   ├── common/                   # Código compartido (guards, interceptors, etc.)
│   ├── config/                   # Configuración de la aplicación
│   ├── database/
│   │   ├── migrations/           # Migraciones de TypeORM
│   │   └── scripts/              # Scripts de BD organizados por tipo
│   │       ├── migrations/       # Scripts de migración de esquema
│   │       ├── seeds/            # Scripts de inicialización de datos
│   │       ├── debug/            # Scripts de depuración y análisis
│   │       ├── fixes/            # Scripts de corrección de datos
│   │       ├── imports/          # Scripts de importación de datos
│   │       ├── utilities/        # Scripts de utilidad general
│   │       └── archived/         # Scripts deprecados
│   ├── entities/                 # Entidades de TypeORM
│   ├── app.module.ts             # Módulo principal
│   ├── app.controller.ts         # Controlador principal
│   ├── app.service.ts            # Servicio principal
│   └── main.ts                   # Punto de entrada
├── docs/                         # Documentación del proyecto
│   ├── guides/                   # Guías de uso
│   ├── api/                      # Documentación de API
│   ├── setup/                    # Guías de configuración
│   ├── implementation/           # Documentación de implementación
│   └── archived/                 # Documentación antigua
├── to_trash/                     # Archivos para revisar y decidir si borrar
├── .kiro/                        # Configuración de Kiro
│   ├── specs/                    # Especificaciones de features
│   └── hooks/                    # Hooks de automatización
├── .vscode/                      # Configuración de VS Code
├── .env                          # Variables de entorno
├── .gitignore                    # Configuración de Git
├── .prettierrc                   # Configuración de Prettier
├── README.md                     # Documentación principal
├── CLEANUP_SUMMARY.md            # Resumen de la limpieza realizada
└── PROJECT_STRUCTURE.md          # Este archivo
```

## Descripción de Carpetas Principales

### `/src`
Código fuente de la aplicación NestJS.

### `/src/database/scripts`
Scripts de base de datos organizados por funcionalidad:

- **migrations/**: Scripts que modifican la estructura de la BD (esquema, permisos, roles)
- **seeds/**: Datos iniciales y catálogos para inicializar la BD
- **debug/**: Consultas y scripts para investigar problemas
- **fixes/**: Correcciones de datos específicas
- **imports/**: Importación de datos desde fuentes externas
- **utilities/**: Operaciones administrativas y recálculos
- **archived/**: Scripts antiguos mantenidos para referencia

### `/docs`
Documentación del proyecto. Estructura para futuro crecimiento.

### `/to_trash`
Archivos movidos del root durante la limpieza. **Revisar y decidir si eliminar permanentemente.**

### `/.kiro`
Configuración de Kiro:
- **specs/**: Especificaciones de features (requirements, design, tasks)
- **hooks/**: Hooks de automatización

## Cómo Usar Scripts de BD

### Ejecutar un script de migración
```bash
ts-node src/database/scripts/migrations/script-name.ts
```

### Ejecutar un script SQL
```bash
mysql -u user -p database < src/database/scripts/migrations/script-name.sql
```

### Ejecutar un script de seed
```bash
ts-node src/database/scripts/seeds/script-name.ts
```

## Limpieza Realizada

Se realizó una limpieza completa del proyecto:

✅ **Root limpio**: Solo archivos esenciales (README.md, .env, .gitignore, etc.)
✅ **Scripts organizados**: Todos los scripts de BD en `src/database/scripts/` por categoría
✅ **Documentación centralizada**: Estructura en `docs/` para documentación futura
✅ **Archivos para revisar**: `to_trash/` contiene ~150 archivos para decisión

Ver `CLEANUP_SUMMARY.md` para detalles completos.

## Próximos Pasos

1. Revisar contenido de `to_trash/`
2. Eliminar archivos innecesarios
3. Mover documentación importante a `docs/`
4. Actualizar `.gitignore` si es necesario
5. Documentar procesos importantes en `docs/guides/`
