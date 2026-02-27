# Solución: Error AccessDenied al Eliminar Documentos de S3

## Problema
Al intentar eliminar documentos de contratos o clientes, se recibe un error 403 AccessDenied de AWS S3:
```
Code: 'AccessDenied'
```

## Causa
El usuario IAM de AWS (`AKIAXKF5DHHRRZSH6TPU`) no tiene permisos para eliminar objetos del bucket S3 `sin-customer-documents`.

## Solución: Actualizar Política IAM en AWS

### Paso 1: Acceder a AWS IAM Console
1. Inicia sesión en AWS Console
2. Ve a IAM (Identity and Access Management)
3. Busca el usuario: `AKIAXKF5DHHRRZSH6TPU`

### Paso 2: Agregar Política de Eliminación
Agrega o actualiza la política del usuario para incluir `s3:DeleteObject`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::sin-customer-documents/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::sin-customer-documents"
    }
  ]
}
```

### Paso 3: Verificar Permisos
Después de actualizar la política, espera 1-2 minutos para que los cambios se propaguen y prueba nuevamente la eliminación de documentos.

## Mejoras Implementadas en el Código

Se han agregado mejoras en el manejo de errores para proporcionar mensajes más claros:

### 1. S3Service (`src/common/services/s3.service.ts`)
- Detecta específicamente errores de AccessDenied
- Proporciona mensaje claro sobre el problema de permisos IAM

### 2. Contract Documents Service (`src/api/contracts/contract-documents.service.ts`)
- Manejo de errores con try-catch
- Solo elimina el registro de la base de datos si la eliminación de S3 fue exitosa
- Mensajes de error en español

### 3. Customer Documents Service (`src/api/customers/customer-documents.service.ts`)
- Mismo manejo de errores que contract documents
- Consistencia en el comportamiento

## Verificación
Una vez actualizados los permisos, prueba:
1. Eliminar un documento de contrato
2. Eliminar un documento de cliente
3. Verificar que el archivo se elimine de S3 y el registro de la base de datos

## Notas de Seguridad
- Los permisos se aplican solo al bucket específico: `sin-customer-documents`
- Se mantiene el principio de menor privilegio
- No se otorgan permisos innecesarios a otros recursos de AWS
