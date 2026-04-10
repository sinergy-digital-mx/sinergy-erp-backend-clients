# 🔧 Solución al Problema de CORS

## ❌ Problema
Al abrir `tenant-modules-admin.html` directamente desde el explorador de archivos (protocolo `file://`), aparece este error:

```
Access to fetch at 'http://localhost:3001/...' from origin 'null' 
has been blocked by CORS policy
```

## ✅ Solución

Ya actualicé el HTML para usar la URL correcta con el prefijo `/api`. Ahora tienes 2 opciones:

---

## Opción 1: Usar un Servidor HTTP Simple (Recomendado)

En lugar de abrir el HTML directamente, sírvelo con un servidor HTTP simple:

### Con Python (si lo tienes instalado)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Luego abre: **http://localhost:8000/tenant-modules-admin.html**

### Con Node.js (si lo tienes instalado)
```bash
# Instalar http-server globalmente (solo una vez)
npm install -g http-server

# Ejecutar
http-server -p 8000
```

Luego abre: **http://localhost:8000/tenant-modules-admin.html**

### Con PHP (si lo tienes instalado)
```bash
php -S localhost:8000
```

Luego abre: **http://localhost:8000/tenant-modules-admin.html**

---

## Opción 2: Abrir Chrome con Flags de Seguridad Deshabilitados

⚠️ **SOLO PARA DESARROLLO LOCAL - NUNCA EN PRODUCCIÓN**

### Windows
```powershell
# Cierra todas las ventanas de Chrome primero
# Luego ejecuta:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\temp\chrome-dev" --allow-file-access-from-files
```

### Mac
```bash
# Cierra todas las ventanas de Chrome primero
# Luego ejecuta:
open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome-dev" --allow-file-access-from-files
```

### Linux
```bash
# Cierra todas las ventanas de Chrome primero
# Luego ejecuta:
google-chrome --disable-web-security --user-data-dir="/tmp/chrome-dev" --allow-file-access-from-files
```

Luego abre el archivo HTML en esa ventana de Chrome.

---

## Opción 3: Usar Firefox (Más Permisivo)

Firefox es más permisivo con `file://` URLs. Simplemente:

1. Abre Firefox
2. Arrastra `tenant-modules-admin.html` a la ventana
3. Debería funcionar sin problemas

---

## 🎯 Recomendación

**Usa la Opción 1 (Servidor HTTP Simple)** porque:
- ✅ Es la forma más segura
- ✅ No requiere deshabilitar seguridad del navegador
- ✅ Simula mejor un entorno real
- ✅ Evita problemas de CORS

---

## 🚀 Ejemplo Completo con Python

```bash
# 1. Asegúrate de que el backend esté corriendo
npm run start:dev

# 2. En otra terminal, en la carpeta del proyecto:
python -m http.server 8000

# 3. Abre tu navegador en:
http://localhost:8000/tenant-modules-admin.html

# ¡Listo! Ahora debería funcionar sin errores de CORS
```

---

## 🔍 Verificar que Funciona

Una vez abierto correctamente, deberías ver:
- ✅ Lista de tenants en el dropdown
- ✅ Sin errores en la consola (F12)
- ✅ Puedes seleccionar un tenant y ver sus módulos

---

## 📝 Nota Técnica

El problema ocurre porque:
1. Los navegadores bloquean peticiones desde `file://` a `http://` por seguridad
2. Esto se llama "Same-Origin Policy"
3. La solución es servir el HTML desde un servidor HTTP (aunque sea local)

---

## 🆘 Si Aún No Funciona

1. **Verifica que el backend esté corriendo:**
   ```bash
   curl http://localhost:3001/api/admin/tenant-modules/tenants
   ```
   Deberías ver una lista de tenants en JSON.

2. **Verifica la consola del navegador:**
   - Presiona F12
   - Ve a la pestaña "Console"
   - Busca errores en rojo

3. **Verifica la pestaña Network:**
   - F12 → Network
   - Recarga la página
   - Busca peticiones fallidas en rojo

---

## ✅ Resumen

**Problema:** CORS bloquea peticiones desde `file://`

**Solución Rápida:**
```bash
python -m http.server 8000
# Abre: http://localhost:8000/tenant-modules-admin.html
```

**Alternativa:** Usa Firefox (más permisivo con file://)

---

¡Ahora sí debería funcionar! 🎉
