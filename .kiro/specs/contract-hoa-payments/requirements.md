# Documento de Requisitos: Pagos HOA de Contratos

## Introducción

Este documento define los requisitos para el sistema de pagos HOA (Homeowners Association) de contratos. El sistema permite generar, registrar y gestionar pagos mensuales de HOA de forma separada a los pagos regulares del contrato, manteniendo un flujo similar pero independiente.

## Glosario

- **HOA_Payment_System**: Sistema de gestión de pagos de HOA (Homeowners Association)
- **Contract_HOA_Payment**: Registro individual de un pago HOA asociado a un contrato
- **Payment_Generator**: Componente que genera automáticamente los pagos HOA mensuales
- **Payment_Recorder**: Componente que registra los pagos HOA realizados
- **HOA_Payment_Repository**: Repositorio de datos para pagos HOA (tabla contract_hoa_payments)
- **Payment_Status**: Estado del pago (pagado, pendiente, parcial, vencido, cancelado)
- **Payment_Method**: Método de pago (efectivo, transferencia, tarjeta, cheque)
- **Monthly_Amount**: Monto mensual del pago HOA
- **Due_Date**: Fecha de vencimiento del pago
- **Payment_Date**: Fecha en que se realizó el pago
- **Reference_Number**: Número de referencia bancaria o de transacción

## Requisitos

### Requisito 1: Generación Automática de Pagos HOA

**User Story:** Como administrador del sistema, quiero generar automáticamente los pagos HOA mensuales para un contrato, para que no tenga que crearlos manualmente uno por uno.

#### Acceptance Criteria

1. WHEN el administrador solicita generar pagos HOA con fecha de inicio, fecha de fin y monto mensual, THE Payment_Generator SHALL crear un pago HOA por cada mes en el rango de fechas especificado
2. THE Payment_Generator SHALL asignar a cada Contract_HOA_Payment un número secuencial comenzando desde 1
3. THE Payment_Generator SHALL establecer el estado inicial de cada Contract_HOA_Payment como "pendiente"
4. THE Payment_Generator SHALL calcular la fecha de vencimiento de cada pago como el día 5 del mes correspondiente
5. THE Payment_Generator SHALL inicializar amount_paid en 0 y amount_pending igual al Monthly_Amount para cada pago generado
6. IF ya existen pagos HOA para el contrato, THEN THE Payment_Generator SHALL retornar un error indicando que los pagos ya fueron generados
7. THE Payment_Generator SHALL asociar cada Contract_HOA_Payment con el tenant_id y contract_id correspondientes

### Requisito 2: Registro de Pagos HOA

**User Story:** Como administrador del sistema, quiero registrar cuando un cliente realiza un pago HOA, para que el sistema actualice el estado y los montos del pago.

#### Acceptance Criteria

1. WHEN el administrador registra un pago HOA con monto, fecha de pago y método de pago, THE Payment_Recorder SHALL actualizar el amount_paid del Contract_HOA_Payment sumando el monto registrado
2. WHEN se registra un pago, THE Payment_Recorder SHALL recalcular el amount_pending restando el monto pagado del monto total
3. IF el amount_paid es mayor o igual al Monthly_Amount, THEN THE Payment_Recorder SHALL cambiar el Payment_Status a "pagado"
4. IF el amount_paid es mayor que 0 pero menor que el Monthly_Amount, THEN THE Payment_Recorder SHALL cambiar el Payment_Status a "parcial"
5. WHEN se registra un pago, THE Payment_Recorder SHALL guardar la Payment_Date proporcionada
6. WHEN se registra un pago, THE Payment_Recorder SHALL guardar el Payment_Method proporcionado
7. WHERE el administrador proporciona un Reference_Number, THE Payment_Recorder SHALL almacenarlo en el Contract_HOA_Payment
8. WHERE el administrador proporciona notas adicionales, THE Payment_Recorder SHALL almacenarlas en el campo notes del Contract_HOA_Payment
9. IF el Contract_HOA_Payment tiene estado "cancelado", THEN THE Payment_Recorder SHALL retornar un error indicando que no se puede registrar un pago en un pago cancelado

### Requisito 3: Consulta de Pagos HOA

**User Story:** Como administrador del sistema, quiero consultar los pagos HOA de un contrato, para que pueda ver el estado y detalles de cada pago.

#### Acceptance Criteria

1. WHEN el administrador solicita los pagos HOA de un contrato, THE HOA_Payment_System SHALL retornar todos los Contract_HOA_Payment asociados al contrato ordenados por payment_number de forma ascendente
2. THE HOA_Payment_System SHALL incluir en cada Contract_HOA_Payment los campos: id, payment_number, status, amount, amount_paid, amount_pending, due_date, paid_date, payment_method y notes
3. WHEN el administrador solicita un pago HOA específico por ID, THE HOA_Payment_System SHALL retornar el Contract_HOA_Payment con todos sus detalles
4. IF el pago HOA solicitado no existe o no pertenece al tenant, THEN THE HOA_Payment_System SHALL retornar un error "Payment not found"

### Requisito 4: Estadísticas de Pagos HOA

**User Story:** Como administrador del sistema, quiero ver estadísticas consolidadas de los pagos HOA de un contrato, para que pueda conocer rápidamente el estado general de los pagos.

#### Acceptance Criteria

1. WHEN el administrador solicita estadísticas de pagos HOA, THE HOA_Payment_System SHALL calcular el total de pagos generados
2. THE HOA_Payment_System SHALL calcular la cantidad de pagos en cada Payment_Status (pagado, pendiente, parcial, vencido, cancelado)
3. THE HOA_Payment_System SHALL calcular el monto total pagado sumando amount_paid de todos los pagos con status "pagado" y "parcial"
4. THE HOA_Payment_System SHALL calcular el monto total pendiente sumando amount_pending de todos los pagos con status "pendiente" y "parcial"
5. THE HOA_Payment_System SHALL calcular el monto total esperado sumando el Monthly_Amount de todos los pagos generados
6. WHERE existe un pago con status "parcial", THE HOA_Payment_System SHALL incluir los detalles del pago parcial (id, payment_number, amount_paid, amount_pending, due_date)

### Requisito 5: Actualización de Pagos HOA

**User Story:** Como administrador del sistema, quiero actualizar los detalles de un pago HOA, para que pueda corregir información incorrecta o agregar detalles adicionales.

#### Acceptance Criteria

1. WHEN el administrador actualiza el amount_paid de un Contract_HOA_Payment, THE HOA_Payment_System SHALL recalcular el amount_pending y actualizar el Payment_Status según las reglas de negocio
2. WHEN el administrador actualiza la due_date, THE HOA_Payment_System SHALL guardar la nueva fecha de vencimiento
3. WHEN el administrador actualiza la paid_date, THE HOA_Payment_System SHALL guardar la nueva fecha de pago
4. WHEN el administrador actualiza el payment_method, THE HOA_Payment_System SHALL guardar el nuevo método de pago
5. WHEN el administrador actualiza las notes, THE HOA_Payment_System SHALL guardar las nuevas notas
6. IF el Contract_HOA_Payment tiene estado "cancelado", THEN THE HOA_Payment_System SHALL retornar un error indicando que no se puede actualizar un pago cancelado
7. THE HOA_Payment_System SHALL agregar una nota automática con la fecha de actualización

### Requisito 6: Cancelación de Pagos HOA

**User Story:** Como administrador del sistema, quiero cancelar un pago HOA, para que pueda marcarlo como no válido sin eliminarlo del sistema.

#### Acceptance Criteria

1. WHEN el administrador cancela un Contract_HOA_Payment, THE HOA_Payment_System SHALL cambiar el Payment_Status a "cancelado"
2. THE HOA_Payment_System SHALL agregar una nota automática indicando la fecha de cancelación
3. IF el Contract_HOA_Payment ya tiene estado "cancelado", THEN THE HOA_Payment_System SHALL retornar un error indicando que el pago ya está cancelado

### Requisito 7: Eliminación de Pagos HOA

**User Story:** Como administrador del sistema, quiero eliminar un pago HOA, para que pueda removerlo completamente del sistema cuando sea necesario.

#### Acceptance Criteria

1. WHEN el administrador elimina un Contract_HOA_Payment, THE HOA_Payment_System SHALL remover el registro de la HOA_Payment_Repository
2. IF el Contract_HOA_Payment no existe o no pertenece al tenant, THEN THE HOA_Payment_System SHALL retornar un error "Payment not found"

### Requisito 8: Reseteo de Pagos HOA

**User Story:** Como administrador del sistema, quiero resetear un pago HOA a su estado inicial, para que pueda deshacer pagos registrados incorrectamente.

#### Acceptance Criteria

1. WHEN el administrador resetea un Contract_HOA_Payment, THE HOA_Payment_System SHALL establecer amount_paid en 0
2. THE HOA_Payment_System SHALL establecer amount_pending igual al Monthly_Amount
3. THE HOA_Payment_System SHALL cambiar el Payment_Status a "pendiente"
4. THE HOA_Payment_System SHALL establecer paid_date como null
5. THE HOA_Payment_System SHALL agregar una nota automática indicando la fecha de reseteo y el monto que se devolvió
6. IF el Contract_HOA_Payment tiene estado "cancelado", THEN THE HOA_Payment_System SHALL retornar un error indicando que no se puede resetear un pago cancelado

### Requisito 9: Marcado de Pagos Vencidos

**User Story:** Como administrador del sistema, quiero que el sistema marque automáticamente los pagos HOA vencidos, para que pueda identificar fácilmente los pagos atrasados.

#### Acceptance Criteria

1. WHEN el administrador ejecuta el proceso de marcado de vencidos, THE HOA_Payment_System SHALL identificar todos los Contract_HOA_Payment con Due_Date anterior a la fecha actual
2. THE HOA_Payment_System SHALL marcar como vencidos solo los pagos con Payment_Status "pendiente" o "parcial"
3. THE HOA_Payment_System SHALL establecer el campo is_overdue en true para los pagos identificados
4. THE HOA_Payment_System SHALL retornar la cantidad de pagos marcados como vencidos

### Requisito 10: Validación de Pago Parcial Único

**User Story:** Como administrador del sistema, quiero que solo exista un pago parcial activo por contrato, para que se mantenga un control claro de los pagos en proceso.

#### Acceptance Criteria

1. WHEN se intenta crear un nuevo pago con status "parcial", THE Payment_Recorder SHALL verificar si ya existe otro Contract_HOA_Payment con status "parcial" en el mismo contrato
2. IF ya existe un pago parcial en el contrato, THEN THE Payment_Recorder SHALL retornar un error indicando que debe completarse el pago parcial existente primero
3. THE Payment_Recorder SHALL incluir en el mensaje de error el payment_number del pago parcial existente
4. THE Payment_Recorder SHALL permitir actualizar el mismo pago parcial existente sin generar error

### Requisito 11: Estructura de Datos de Pagos HOA

**User Story:** Como desarrollador del sistema, quiero que los pagos HOA tengan una estructura de datos bien definida, para que se mantenga la consistencia y se facilite el mantenimiento.

#### Acceptance Criteria

1. THE HOA_Payment_Repository SHALL almacenar cada Contract_HOA_Payment con un identificador único (UUID)
2. THE HOA_Payment_Repository SHALL almacenar tenant_id como clave foránea a la tabla de tenants
3. THE HOA_Payment_Repository SHALL almacenar contract_id como clave foránea a la tabla de contratos
4. THE HOA_Payment_Repository SHALL almacenar payment_number como cadena de texto de máximo 50 caracteres
5. THE HOA_Payment_Repository SHALL almacenar amount, amount_paid y amount_pending como números decimales con precisión 15 y escala 2
6. THE HOA_Payment_Repository SHALL almacenar due_date, paid_date y first_partial_payment_date como fechas
7. THE HOA_Payment_Repository SHALL almacenar payment_method como cadena de texto de máximo 50 caracteres
8. THE HOA_Payment_Repository SHALL almacenar status como enumeración con valores: pagado, pendiente, parcial, cancelado
9. THE HOA_Payment_Repository SHALL almacenar is_overdue como valor booleano con valor por defecto false
10. THE HOA_Payment_Repository SHALL almacenar notes como texto largo opcional
11. THE HOA_Payment_Repository SHALL almacenar created_at y updated_at como marcas de tiempo automáticas

### Requisito 12: Índices de Base de Datos

**User Story:** Como desarrollador del sistema, quiero que la tabla de pagos HOA tenga índices apropiados, para que las consultas sean eficientes.

#### Acceptance Criteria

1. THE HOA_Payment_Repository SHALL crear un índice en el campo tenant_id
2. THE HOA_Payment_Repository SHALL crear un índice en el campo contract_id
3. THE HOA_Payment_Repository SHALL crear un índice en el campo due_date
4. THE HOA_Payment_Repository SHALL crear un índice en el campo status

### Requisito 13: API REST para Pagos HOA

**User Story:** Como desarrollador frontend, quiero una API REST para gestionar pagos HOA, para que pueda integrar la funcionalidad en la interfaz de usuario.

#### Acceptance Criteria

1. THE HOA_Payment_System SHALL exponer un endpoint POST /tenant/contracts/:contractId/hoa-payments/generate para generar pagos HOA
2. THE HOA_Payment_System SHALL exponer un endpoint GET /tenant/contracts/:contractId/hoa-payments para listar pagos HOA
3. THE HOA_Payment_System SHALL exponer un endpoint GET /tenant/contracts/:contractId/hoa-payments/stats para obtener estadísticas
4. THE HOA_Payment_System SHALL exponer un endpoint GET /tenant/contracts/:contractId/hoa-payments/:paymentId para obtener un pago específico
5. THE HOA_Payment_System SHALL exponer un endpoint PUT /tenant/contracts/:contractId/hoa-payments/:paymentId para actualizar un pago
6. THE HOA_Payment_System SHALL exponer un endpoint POST /tenant/contracts/:contractId/hoa-payments/:paymentId/pay para registrar un pago
7. THE HOA_Payment_System SHALL exponer un endpoint POST /tenant/contracts/:contractId/hoa-payments/:paymentId/cancel para cancelar un pago
8. THE HOA_Payment_System SHALL exponer un endpoint POST /tenant/contracts/:contractId/hoa-payments/:paymentId/reset para resetear un pago
9. THE HOA_Payment_System SHALL exponer un endpoint DELETE /tenant/contracts/:contractId/hoa-payments/:paymentId para eliminar un pago
10. THE HOA_Payment_System SHALL exponer un endpoint POST /tenant/contracts/:contractId/hoa-payments/mark-overdue para marcar pagos vencidos

### Requisito 14: Validación de DTOs

**User Story:** Como desarrollador del sistema, quiero que los datos de entrada sean validados, para que se prevengan errores y datos inconsistentes.

#### Acceptance Criteria

1. WHEN se recibe una solicitud de generación de pagos, THE HOA_Payment_System SHALL validar que start_date sea una fecha válida
2. THE HOA_Payment_System SHALL validar que end_date sea una fecha válida y posterior a start_date
3. THE HOA_Payment_System SHALL validar que monthly_amount sea un número mayor que 0
4. WHEN se recibe una solicitud de registro de pago, THE HOA_Payment_System SHALL validar que amount sea un número mayor que 0
5. THE HOA_Payment_System SHALL validar que payment_date sea una fecha válida
6. THE HOA_Payment_System SHALL validar que payment_method sea una cadena no vacía
7. WHERE se proporciona reference_number, THE HOA_Payment_System SHALL validarlo como cadena opcional
8. WHERE se proporcionan notes, THE HOA_Payment_System SHALL validarlas como cadena opcional

### Requisito 15: Control de Acceso y Permisos

**User Story:** Como administrador del sistema, quiero que las operaciones de pagos HOA estén protegidas por permisos, para que solo usuarios autorizados puedan realizar cambios.

#### Acceptance Criteria

1. THE HOA_Payment_System SHALL requerir autenticación JWT para todos los endpoints de pagos HOA
2. THE HOA_Payment_System SHALL requerir permiso "Contract:Create" para generar pagos HOA
3. THE HOA_Payment_System SHALL requerir permiso "Contract:Read" para consultar pagos HOA y estadísticas
4. THE HOA_Payment_System SHALL requerir permiso "Contract:Update" para registrar, actualizar, cancelar y resetear pagos HOA
5. THE HOA_Payment_System SHALL requerir permiso "Contract:Delete" para eliminar pagos HOA
6. THE HOA_Payment_System SHALL validar que todas las operaciones se realicen dentro del contexto del tenant actual

