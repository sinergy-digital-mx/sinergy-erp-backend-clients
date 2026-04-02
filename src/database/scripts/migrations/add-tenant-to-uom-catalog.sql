-- Agregar tenant_id a uom_catalog

-- 1. Agregar columna tenant_id (nullable temporalmente)
ALTER TABLE uom_catalog 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id;

-- 2. Asignar el primer tenant a registros existentes
UPDATE uom_catalog 
SET tenant_id = (SELECT id FROM rbac_tenants LIMIT 1)
WHERE tenant_id IS NULL;

-- 3. Hacer la columna NOT NULL
ALTER TABLE uom_catalog 
MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL;

-- 4. Agregar foreign key
ALTER TABLE uom_catalog
ADD CONSTRAINT fk_uom_catalog_tenant
FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE;

-- 5. Agregar índice en tenant_id
CREATE INDEX tenant_index ON uom_catalog(tenant_id);

-- 6. Agregar índice único en tenant_id + name (no code)
CREATE UNIQUE INDEX tenant_name_index ON uom_catalog(tenant_id, name);

-- Verificar
SELECT * FROM uom_catalog LIMIT 5;
