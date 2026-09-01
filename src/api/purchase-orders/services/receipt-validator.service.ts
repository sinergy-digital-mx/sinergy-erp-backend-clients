import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import {
  ReceiptLotMode,
  ReceivedItemDto,
  ReceivedLotDto,
} from '../dto/receive-purchase-order.dto';

@Injectable()
export class ReceiptValidatorService {
  constructor(
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly purchaseOrderDetailRepository: Repository<PurchaseOrderBatchDetail>,
  ) {}

  /**
   * Validate received items before processing receipt
   * @param items - Array of received items to validate
   * @throws BadRequestException if validation fails
   * @throws NotFoundException if line item not found
   */
  async validateReceivedItems(items: ReceivedItemDto[]): Promise<void> {
    // Validate each item first (before checking for at least one item)
    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
      const lots = item.lots || [];
      const lotMode = item.lot_mode || (hasLots ? ReceiptLotMode.MULTIPLE : ReceiptLotMode.SINGLE);
      const lotsTotalQuantity = hasLots
        ? lots.reduce((acc, lot) => acc + Number(lot.quantity || 0), 0)
        : 0;
      const effectiveQuantity =
        lotMode === ReceiptLotMode.MULTIPLE ? lotsTotalQuantity : quantity;

      // Validation 2: All quantities are non-negative
      if (effectiveQuantity < 0) {
        throw new BadRequestException(
          `La cantidad recibida no puede ser negativa para la línea ${item.line_item_id}`,
        );
      }

      // Validation 3: Quantities do not exceed 999,999.999
      if (effectiveQuantity > 999999.999) {
        throw new BadRequestException(
          `La cantidad recibida excede el límite máximo (999,999.999) para la línea ${item.line_item_id}`,
        );
      }

      if (lotMode === ReceiptLotMode.MULTIPLE && !hasLots) {
        throw new BadRequestException(
          `Se requiere al menos un lote en modo múltiple para la línea ${item.line_item_id}`,
        );
      }

      if (lotMode === ReceiptLotMode.MULTIPLE && hasLots) {
        for (const lot of lots) {
          if (!lot.tag_identifier?.trim()) {
            throw new BadRequestException(
              `Se requiere etiqueta/identificador para cada lote de la línea ${item.line_item_id}`,
            );
          }

          if (Number(lot.quantity || 0) <= 0) {
            throw new BadRequestException(
              `La cantidad del lote debe ser mayor a cero para la línea ${item.line_item_id}`,
            );
          }

          if (lot.product_uom_id !== item.product_uom_id) {
            throw new BadRequestException(
              `La UoM del lote debe coincidir con la UoM de la línea ${item.line_item_id}`,
            );
          }

          this.assertValidMeasure(
            lot.measure,
            lot.measure_uom_id ?? item.measure_uom_id,
            item.line_item_id,
          );
        }
      } else {
        this.assertValidMeasure(item.measure, item.measure_uom_id, item.line_item_id);
      }

      // Validation 4: Line item exists in database
      const lineItem = await this.purchaseOrderDetailRepository.findOne({
        where: { id: item.line_item_id },
      });

      if (!lineItem) {
        throw new NotFoundException(`Línea no encontrada: ${item.line_item_id}`);
      }
    }

    // Validation 1: At least one item with quantity > 0
    const hasAtLeastOneItem = items.some((item) => {
      const hasLots = Array.isArray(item.lots) && item.lots.length > 0;
      const lotMode =
        item.lot_mode || (hasLots ? ReceiptLotMode.MULTIPLE : ReceiptLotMode.SINGLE);
      if (lotMode === ReceiptLotMode.MULTIPLE) {
        return (item.lots || []).some((lot) => Number(lot.quantity || 0) > 0);
      }
      return Number(item.quantity || 0) > 0;
    });
    if (!hasAtLeastOneItem) {
      throw new BadRequestException('Se debe recibir al menos un producto con cantidad mayor a cero');
    }
  }

  private assertValidMeasure(
    measure: ReceivedLotDto['measure'],
    measureUomId: string | undefined,
    lineItemId: string,
  ): void {
    const hasMeasure = measure !== undefined && measure !== null;
    const hasUom = Boolean(measureUomId?.trim());

    if (!hasMeasure && !hasUom) {
      return;
    }

    if (hasMeasure && !hasUom) {
      throw new BadRequestException(
        `Indica la unidad del tamaño (Foot, PIES, …) para la línea ${lineItemId}. No uses la unidad de la orden de compra`,
      );
    }

    if (!hasMeasure && hasUom) {
      throw new BadRequestException(
        `Indica el tamaño (8, 12, …) para la línea ${lineItemId}`,
      );
    }

    const value = Number(measure);
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(
        `El tamaño debe ser mayor a cero para la línea ${lineItemId}`,
      );
    }
    if (value > 999999.999) {
      throw new BadRequestException(
        `El tamaño excede el límite máximo (999,999.999) para la línea ${lineItemId}`,
      );
    }
  }
}
