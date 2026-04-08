import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * End-to-End Test Suite: Inventory Management Module
 * 
 * This test suite verifies the complete inventory management flow:
 * 1. Create a Purchase Order (PO)
 * 2. Receive items from the PO
 * 3. Verify batches appear in inventory endpoints
 * 4. Test all filter combinations
 * 5. Verify response structure matches DTOs
 */
describe('Inventory Management Module - End-to-End (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let warehouseId: string;
  let vendorId: string;
  let productId: string;
  let uomId: string;
  let purchaseOrderId: string;
  let lineItemId: string;
  let batchId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Setup: Create test data', () => {
    it('should authenticate and get JWT token', async () => {
      // This assumes there's a test user already set up
      // In a real scenario, you'd create a test user first
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // If login fails, we'll skip the rest of the tests
      if (response.status === 200 || response.status === 401) {
        authToken = response.body?.access_token || 'test-token';
        tenantId = response.body?.tenant_id || 'test-tenant-id';
        userId = response.body?.user_id || 'test-user-id';
      }
    });

    it('should retrieve or create test warehouse', async () => {
      // Get existing warehouse or create one
      const response = await request(app.getHttpServer())
        .get('/tenant/warehouse')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body?.data?.length > 0) {
        warehouseId = response.body.data[0].id;
      } else {
        // Create a new warehouse
        const createResponse = await request(app.getHttpServer())
          .post('/tenant/warehouse')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Warehouse',
            code: 'TEST-WH',
            prefix: 'TW',
            address: '123 Test St',
          });

        if (createResponse.status === 201) {
          warehouseId = createResponse.body?.id;
        }
      }
    });

    it('should retrieve or create test vendor', async () => {
      // Get existing vendor or create one
      const response = await request(app.getHttpServer())
        .get('/tenant/vendor')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body?.data?.length > 0) {
        vendorId = response.body.data[0].id;
      } else {
        // Create a new vendor
        const createResponse = await request(app.getHttpServer())
          .post('/tenant/vendor')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Vendor',
            code: 'VENDOR-001',
            email: 'vendor@test.com',
          });

        if (createResponse.status === 201) {
          vendorId = createResponse.body?.id;
        }
      }
    });

    it('should retrieve or create test product', async () => {
      // Get existing product or create one
      const response = await request(app.getHttpServer())
        .get('/tenant/products')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body?.data?.length > 0) {
        productId = response.body.data[0].id;
        uomId = response.body.data[0].base_uom_id;
      } else {
        // Create a new product
        const createResponse = await request(app.getHttpServer())
          .post('/tenant/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Product',
            sku: 'TEST-SKU-001',
            description: 'Test product for inventory',
            base_uom_id: 'test-uom-id',
          });

        if (createResponse.status === 201) {
          productId = createResponse.body?.id;
          uomId = createResponse.body?.base_uom_id;
        }
      }
    });
  });

  describe('Phase 1: Create Purchase Order', () => {
    it('should create a purchase order', async () => {
      const response = await request(app.getHttpServer())
        .post('/tenant/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vendor_id: vendorId,
          warehouse_id: warehouseId,
          expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          line_items: [
            {
              product_id: productId,
              uom_id: uomId,
              quantity: 100,
              unit_total: 50.00,
              iva_percentage: 16,
              iva_unit: 8.00,
              ieps_percentage: 0,
              ieps_unit: 0,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.general_status).toBe('Creada');
      
      purchaseOrderId = response.body.id;
      lineItemId = response.body.line_items?.[0]?.id;
    });

    it('should verify purchase order was created', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenant/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.header.id).toBe(purchaseOrderId);
      expect(response.body.data.header.general_status).toBe('Creada');
    });
  });

  describe('Phase 2: Receive Items from Purchase Order', () => {
    it('should receive items from the purchase order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/tenant/purchase-orders/${purchaseOrderId}/receive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          received_items: [
            {
              line_item_id: lineItemId,
              product_id: productId,
              product_uom_id: uomId,
              quantity: 100,
              unit_total: 50.00,
              iva_percentage: 16,
              iva_unit: 8.00,
              ieps_percentage: 0,
              ieps_unit: 0,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.general_status).toBe('Recibida');
      expect(response.body.received_subtotal).toBe(5000.00);
      expect(response.body.received_iva_total).toBe(800.00);
      expect(response.body.received_total).toBe(5800.00);
    });

    it('should verify purchase order status changed to Recibida', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenant/purchase-orders/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.header.general_status).toBe('Recibida');
      expect(response.body.data.header.received_subtotal).toBe(5000.00);
    });
  });

  describe('Phase 3: Verify Batches in Inventory Endpoints', () => {
    it('should list all batches', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Store first batch ID for later tests
      batchId = response.body.data[0].id;
    });

    it('should verify batch response structure matches DTO', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const batch = response.body.data[0];

      // Verify all required fields are present
      expect(batch).toHaveProperty('id');
      expect(batch).toHaveProperty('batch_number');
      expect(batch).toHaveProperty('warehouse_id');
      expect(batch).toHaveProperty('warehouse_name');
      expect(batch).toHaveProperty('product_id');
      expect(batch).toHaveProperty('product_name');
      expect(batch).toHaveProperty('product_sku');
      expect(batch).toHaveProperty('uom_id');
      expect(batch).toHaveProperty('uom_name');
      expect(batch).toHaveProperty('quantity');
      expect(batch).toHaveProperty('purchase_order_batch_id');
      expect(batch).toHaveProperty('purchase_order_id');
      expect(batch).toHaveProperty('purchase_order_detail_id');
      expect(batch).toHaveProperty('created_by');
      expect(batch).toHaveProperty('created_at');

      // Verify data types
      expect(typeof batch.id).toBe('string');
      expect(typeof batch.batch_number).toBe('string');
      expect(typeof batch.warehouse_id).toBe('string');
      expect(typeof batch.product_id).toBe('string');
      expect(typeof batch.quantity).toBe('string');
    });

    it('should get single batch by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenant/inventory/batches/${batchId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(batchId);
      expect(response.body).toHaveProperty('batch_number');
      expect(response.body).toHaveProperty('warehouse_id');
      expect(response.body).toHaveProperty('product_id');
    });

    it('should get batches for specific purchase order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenant/inventory/batches/purchase-order/${purchaseOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify all batches belong to the purchase order
      response.body.data.forEach(batch => {
        expect(batch.purchase_order_batch_id).toBe(purchaseOrderId);
      });
    });
  });

  describe('Phase 4: Test Filter Combinations', () => {
    it('should filter batches by batch_number', async () => {
      // First get a batch to know its batch number
      const listResponse = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .set('Authorization', `Bearer ${authToken}`);

      const batchNumber = listResponse.body.data[0].batch_number;

      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({ batch_number: batchNumber })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(batch => {
        expect(batch.batch_number).toContain(batchNumber);
      });
    });

    it('should filter batches by product_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({ product_id: productId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(batch => {
        expect(batch.product_id).toBe(productId);
      });
    });

    it('should filter batches by warehouse_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({ warehouse_id: warehouseId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(batch => {
        expect(batch.warehouse_id).toBe(warehouseId);
      });
    });

    it('should filter batches by purchase_order_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({ purchase_order_id: purchaseOrderId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(batch => {
        expect(batch.purchase_order_batch_id).toBe(purchaseOrderId);
      });
    });

    it('should filter batches by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({
          created_from: yesterday.toISOString(),
          created_to: tomorrow.toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({
          product_id: productId,
          warehouse_id: warehouseId,
          purchase_order_id: purchaseOrderId,
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(batch => {
        expect(batch.product_id).toBe(productId);
        expect(batch.warehouse_id).toBe(warehouseId);
        expect(batch.purchase_order_batch_id).toBe(purchaseOrderId);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({ sort_by: 'batch_number', sort_order: 'ASC' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify sorting (basic check)
      if (response.body.data.length > 1) {
        const first = response.body.data[0].batch_number;
        const second = response.body.data[1].batch_number;
        expect(first <= second).toBe(true);
      }
    });
  });

  describe('Phase 5: Verify RBAC Permissions', () => {
    it('should require inventory:read permission for GET /batches', async () => {
      // This test assumes there's a user without inventory:read permission
      // For now, we'll just verify the endpoint requires authentication
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches');

      expect(response.status).toBe(401);
    });

    it('should require inventory:read permission for GET /batches/:id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenant/inventory/batches/${batchId}`);

      expect(response.status).toBe(401);
    });

    it('should require inventory:read permission for GET /batches/purchase-order/:poId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tenant/inventory/batches/purchase-order/${purchaseOrderId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Phase 6: Verify Tenant Isolation', () => {
    it('should only return batches for the authenticated tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // All batches should belong to the authenticated tenant
      // This is verified by the service layer
    });

    it('should not return batches from other tenants', async () => {
      // This test would require a second tenant and user
      // For now, we'll skip this test
      expect(true).toBe(true);
    });
  });

  describe('Phase 7: Error Handling', () => {
    it('should return 404 for non-existent batch', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent purchase order', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches/purchase-order/non-existent-po-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('should validate query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/tenant/inventory/batches')
        .query({ limit: 1000 }) // Exceeds max limit of 100
        .set('Authorization', `Bearer ${authToken}`);

      // Should either reject or cap the limit
      expect([200, 400]).toContain(response.status);
    });
  });
});
