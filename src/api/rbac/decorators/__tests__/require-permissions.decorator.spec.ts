import { SetMetadata } from '@nestjs/common';
import {
  RequirePermissions,
  RequirePermission,
  RequireCreate,
  RequireRead,
  RequireUpdate,
  RequireDelete,
  RequireCustomerRead,
  RequireCustomerCreate,
  RequireCustomerUpdate,
  RequireCustomerDelete,
  RequireLeadRead,
  RequireLeadCreate,
  RequireLeadUpdate,
  RequireLeadDelete,
  RequireUserRead,
  RequireUserCreate,
  RequireUserUpdate,
  RequireUserDelete,
  RequireAdmin,
  RequireReadOnly,
  RequireFullAccess,
  PERMISSIONS_KEY,
  RequiredPermission,
} from '../require-permissions.decorator';

// Mock SetMetadata to capture calls
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

describe('RequirePermissions Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RequirePermissions', () => {
    it('should call SetMetadata with correct key and permissions array', () => {
      const permissions: RequiredPermission[] = [
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Customer', action: 'Update' },
      ];

      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, permissions);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle single permission', () => {
      const permission: RequiredPermission = { entityType: 'User', action: 'Create' };

      RequirePermissions(permission);

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [permission]);
    });

    it('should handle empty permissions array', () => {
      RequirePermissions();

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, []);
    });

    it('should handle multiple permissions', () => {
      const permissions: RequiredPermission[] = [
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Lead', action: 'Create' },
        { entityType: 'User', action: 'Delete' },
      ];

      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, permissions);
    });
  });

  describe('RequirePermission', () => {
    it('should create single permission requirement', () => {
      RequirePermission('Customer', 'Read');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Customer', action: 'Read' },
      ]);
    });

    it('should handle different entity types and actions', () => {
      RequirePermission('Lead', 'Update');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Lead', action: 'Update' },
      ]);
    });
  });

  describe('CRUD Convenience Decorators', () => {
    it('should create correct Create permission', () => {
      RequireCreate('Customer');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Customer', action: 'Create' },
      ]);
    });

    it('should create correct Read permission', () => {
      RequireRead('Lead');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Lead', action: 'Read' },
      ]);
    });

    it('should create correct Update permission', () => {
      RequireUpdate('User');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'User', action: 'Update' },
      ]);
    });

    it('should create correct Delete permission', () => {
      RequireDelete('Order');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Order', action: 'Delete' },
      ]);
    });
  });

  describe('Entity-Specific Convenience Decorators', () => {
    describe('Customer decorators', () => {
      it('should create Customer Read permission', () => {
        RequireCustomerRead();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Customer', action: 'Read' },
        ]);
      });

      it('should create Customer Create permission', () => {
        RequireCustomerCreate();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Customer', action: 'Create' },
        ]);
      });

      it('should create Customer Update permission', () => {
        RequireCustomerUpdate();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Customer', action: 'Update' },
        ]);
      });

      it('should create Customer Delete permission', () => {
        RequireCustomerDelete();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Customer', action: 'Delete' },
        ]);
      });
    });

    describe('Lead decorators', () => {
      it('should create Lead Read permission', () => {
        RequireLeadRead();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Lead', action: 'Read' },
        ]);
      });

      it('should create Lead Create permission', () => {
        RequireLeadCreate();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Lead', action: 'Create' },
        ]);
      });

      it('should create Lead Update permission', () => {
        RequireLeadUpdate();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Lead', action: 'Update' },
        ]);
      });

      it('should create Lead Delete permission', () => {
        RequireLeadDelete();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'Lead', action: 'Delete' },
        ]);
      });
    });

    describe('User decorators', () => {
      it('should create User Read permission', () => {
        RequireUserRead();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'User', action: 'Read' },
        ]);
      });

      it('should create User Create permission', () => {
        RequireUserCreate();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'User', action: 'Create' },
        ]);
      });

      it('should create User Update permission', () => {
        RequireUserUpdate();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'User', action: 'Update' },
        ]);
      });

      it('should create User Delete permission', () => {
        RequireUserDelete();

        expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
          { entityType: 'User', action: 'Delete' },
        ]);
      });
    });
  });

  describe('Complex Convenience Decorators', () => {
    it('should create admin permissions (User Create, Update, Delete)', () => {
      RequireAdmin();

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'User', action: 'Create' },
        { entityType: 'User', action: 'Update' },
        { entityType: 'User', action: 'Delete' },
      ]);
    });

    it('should create read-only permissions for single entity', () => {
      RequireReadOnly('Customer');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Customer', action: 'Read' },
      ]);
    });

    it('should create read-only permissions for multiple entities', () => {
      RequireReadOnly('Customer', 'Lead', 'Order');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Lead', action: 'Read' },
        { entityType: 'Order', action: 'Read' },
      ]);
    });

    it('should create full access permissions (CRUD)', () => {
      RequireFullAccess('Customer');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Customer', action: 'Create' },
        { entityType: 'Customer', action: 'Read' },
        { entityType: 'Customer', action: 'Update' },
        { entityType: 'Customer', action: 'Delete' },
      ]);
    });
  });

  describe('Constants and Types', () => {
    it('should export correct PERMISSIONS_KEY', () => {
      expect(PERMISSIONS_KEY).toBe('permissions');
    });

    it('should have correct RequiredPermission interface structure', () => {
      // This is a compile-time check - if the interface changes, this test will fail
      const permission: RequiredPermission = {
        entityType: 'Customer',
        action: 'Read',
      };

      expect(permission.entityType).toBe('Customer');
      expect(permission.action).toBe('Read');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string entity type', () => {
      RequirePermission('', 'Read');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: '', action: 'Read' },
      ]);
    });

    it('should handle empty string action', () => {
      RequirePermission('Customer', '');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Customer', action: '' },
      ]);
    });

    it('should handle special characters in entity type and action', () => {
      RequirePermission('Custom-Entity_Type', 'Special:Action');

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        { entityType: 'Custom-Entity_Type', action: 'Special:Action' },
      ]);
    });

    it('should handle RequireReadOnly with empty array', () => {
      RequireReadOnly();

      expect(mockSetMetadata).toHaveBeenCalledWith(PERMISSIONS_KEY, []);
    });
  });

  describe('Decorator Composition', () => {
    it('should allow chaining multiple decorator calls', () => {
      // Simulate applying multiple decorators to the same method
      RequireCustomerRead();
      RequireLeadRead();

      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, PERMISSIONS_KEY, [
        { entityType: 'Customer', action: 'Read' },
      ]);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, PERMISSIONS_KEY, [
        { entityType: 'Lead', action: 'Read' },
      ]);
    });
  });
});