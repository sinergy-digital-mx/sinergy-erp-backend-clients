# Database Scripts Organization

Esta carpeta contiene todos los scripts de base de datos organizados por categoría.

## Estructura de Carpetas

### `/migrations`
Scripts de migración de base de datos. Estos scripts se ejecutan una sola vez para cambiar la estructura de la BD.
- Cambios de esquema
- Adiciones de columnas/tablas
- Cambios de permisos y roles

### `/seeds`
Scripts de inicialización de datos. Se usan para poblar la BD con datos iniciales.
- Datos de catálogos
- Configuraciones iniciales
- Datos de prueba

### `/debug`
Scripts de depuración y análisis. Se usan para investigar problemas y verificar datos.
- Consultas de verificación
- Scripts de análisis
- Herramientas de diagnóstico

### `/fixes`
Scripts para corregir problemas específicos en datos existentes.
- Correcciones de datos
- Reparación de inconsistencias
- Ajustes de valores

### `/imports`
Scripts para importar datos desde fuentes externas.
- Importación de Excel
- Importación de datos de terceros
- Migraciones de datos

### `/utilities`
Scripts de utilidad general para mantenimiento.
- Recálculos
- Limpieza de datos
- Operaciones administrativas

### `/archived`
Scripts antiguos o deprecados que se mantienen para referencia histórica.

## Cómo Usar

1. **Para migrar**: Ejecuta scripts en `/migrations` en orden
2. **Para inicializar datos**: Ejecuta scripts en `/seeds` después de migraciones
3. **Para depurar**: Usa scripts en `/debug` para investigar problemas
4. **Para corregir**: Usa scripts en `/fixes` cuando sea necesario
5. **Para importar**: Usa scripts en `/imports` para datos externos

## Notas

- Los scripts TypeScript se ejecutan con `ts-node`
- Los scripts SQL se ejecutan directamente en la BD
- Siempre hacer backup antes de ejecutar scripts de fixes o imports
