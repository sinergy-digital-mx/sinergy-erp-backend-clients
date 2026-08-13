# UI — Modal camión con tabs (General + Fotos)

Replicar el patrón del **catálogo de productos**: modal con pestañas, no un formulario plano.

## Layout del modal (crear / editar)

```
Editar camión / Nuevo camión
┌─────────────────────────────────────┐
│ [ General ]  [ Fotos ]              │
├─────────────────────────────────────┤
│  (contenido del tab activo)         │
├─────────────────────────────────────┤
│              Cancelar    Guardar    │
└─────────────────────────────────────┘
```

Igual que producto: tabs arriba; footer con Cancelar / Guardar fuera de los tabs.

---

## Tab General

Campos actuales del form:

| Campo UI | API |
|----------|-----|
| Nombre * | `name` |
| Placa * | `placa` |
| Número de serie | `serial_number` |
| Año | `anio` |
| Acordeón SCT / seguro | `permiso_sct`, `numero_permiso_sct`, `tipo_auto_transporte`, `aseguradora_rc`, `poliza_rc`, `subtipo_remolque1`, `placa_remolque1` |

- **Crear:** `POST /api/tenant/trucks`
- **Editar:** `PUT /api/tenant/trucks/:id`
- No enviar `photo` en create/update JSON.

---

## Tab Fotos

Misma UX que el tab **Fotos** del modal de producto:

1. Mostrar preview si `photo` tiene URL (viene del `GET /:id` o de la fila).
2. Input file / dropzone (jpg, png, webp).
3. Al seleccionar archivo → subir **en cuanto hay `id`**:

```http
POST /api/tenant/trucks/:id/photo
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
  file: <File>
```

Ejemplo JS:

```ts
const formData = new FormData();
formData.append('file', selectedFile);

await api.post(`/tenant/trucks/${truckId}/photo`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

4. Respuesta: objeto camión completo; usar `photo` (URL firmada) para el preview.
5. **Crear:** Guardar primero el tab General → obtener `id` → habilitar tab Fotos (o subir tras el create exitoso). Deshabilitar Fotos hasta tener `id`, igual que productos.
6. **Editar:** tab Fotos activo de inmediato; preview con `truck.photo` del GET.
7. Reemplazo: otro `POST .../photo` con el nuevo archivo.

### Lista / tabla

Opcional: thumbnail con `photo` del listado (`GET /tenant/trucks`). Si es `null`, placeholder.

---

## Flujo recomendado (editar)

1. Abrir modal → `GET /tenant/trucks/:id` → precargar General + preview Fotos.
2. Guardar General → `PUT /tenant/trucks/:id`.
3. En Fotos, al elegir imagen → `POST /tenant/trucks/:id/photo` (no va en el PUT).
4. Actualizar preview con `response.photo`.

## Permisos UI

| Acción | Permiso |
|--------|---------|
| Ver tabs / datos | `Truck` + `Read` |
| Guardar General | `Truck` + `Create` o `Update` |
| Subir foto | `Truck` + `Update` |
