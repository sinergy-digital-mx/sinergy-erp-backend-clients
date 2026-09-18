import { Injectable } from '@nestjs/common';
import {
  CustomerActivityStatus,
  CustomerActivityType,
} from '../../../entities/customers/customer-activity.entity';
import {
  ExcelColumnDef,
  buildExportSubtitle,
  buildStyledExcelBuffer,
  formatExportDate,
  formatExportDateTime,
} from '../../../common/utils/excel-export.util';
import {
  CrmAttentionFilter,
  QueryCrmActivityDto,
} from '../dto/query-crm-activity.dto';
import { CrmActivityItemDto } from '../dto/crm-activity-response.dto';
import { CrmInboxService } from './crm-inbox.service';

const TYPE_LABELS: Record<string, string> = {
  [CustomerActivityType.NOTE]: 'Nota',
  [CustomerActivityType.CALL]: 'Llamada',
  [CustomerActivityType.EMAIL]: 'Correo',
  [CustomerActivityType.MEETING]: 'Reunión',
  [CustomerActivityType.TASK]: 'Tarea',
  [CustomerActivityType.FOLLOW_UP]: 'Seguimiento',
  [CustomerActivityType.PURCHASE]: 'Compra',
  [CustomerActivityType.SUPPORT]: 'Soporte',
};

const STATUS_LABELS: Record<string, string> = {
  [CustomerActivityStatus.COMPLETED]: 'Completada',
  [CustomerActivityStatus.SCHEDULED]: 'Programada',
  [CustomerActivityStatus.CANCELLED]: 'Cancelada',
  [CustomerActivityStatus.IN_PROGRESS]: 'En progreso',
};

const OUTCOME_LABELS: Record<string, string> = {
  satisfied: 'Satisfecho',
  issue_resolved: 'Problema resuelto',
  escalated: 'Escalado',
  follow_up_needed: 'Requiere seguimiento',
};

const ATTENTION_LABELS: Record<string, string> = {
  [CrmAttentionFilter.FOLLOW_UP_PENDING]: 'Seguimientos pendientes',
  [CrmAttentionFilter.FOLLOW_UP_OVERDUE]: 'Seguimientos vencidos',
  [CrmAttentionFilter.CALL_PENDING]: 'Llamadas pendientes',
  [CrmAttentionFilter.TASK_PENDING]: 'Tareas pendientes',
};

@Injectable()
export class CrmInboxExportService {
  private readonly columns: ExcelColumnDef[] = [
    { header: 'Cliente', key: 'customer_name', width: 28 },
    { header: 'Vendedor', key: 'seller_name', width: 22 },
    { header: 'Tipo', key: 'type_label', width: 14 },
    { header: 'Título', key: 'title', width: 32 },
    { header: 'Descripción', key: 'description', width: 36 },
    { header: 'Notas', key: 'notes', width: 36 },
    { header: 'Estado', key: 'status_label', width: 14 },
    { header: 'Fecha', key: 'activity_date', width: 14, type: 'date' },
    { header: 'Seguimiento', key: 'follow_up_date', width: 14, type: 'date' },
    { header: 'Duración (min)', key: 'duration_minutes', width: 14, type: 'integer' },
    { header: 'Resultado', key: 'outcome_label', width: 20 },
    { header: 'Vencido', key: 'is_overdue', width: 10 },
    { header: 'Creado', key: 'created_at', width: 18, type: 'date' },
  ];

  constructor(private readonly inboxService: CrmInboxService) {}

  async exportExcel(
    tenantId: string,
    actorUserId: string,
    hasAdminRole: boolean,
    query: QueryCrmActivityDto,
  ): Promise<Buffer> {
    const { activities, period_label } = await this.inboxService.listForExport(
      tenantId,
      actorUserId,
      hasAdminRole,
      query,
    );
    const rows = activities.map((row) => this.mapRow(row));
    return buildStyledExcelBuffer({
      sheetName: 'Actividades',
      title: 'Reporte CRM — Actividades',
      subtitle: buildExportSubtitle([
        `Periodo: ${period_label}`,
        this.filterSubtitle(query),
        `Generado: ${formatExportDateTime(new Date())}`,
        `Registros: ${rows.length}`,
      ]),
      columns: this.columns,
      rows,
      headerColor: 'FF4F46E5',
      titleColor: 'FF3730A3',
    });
  }

  getFilename(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `crm-actividades-${y}-${m}-${d}.xlsx`;
  }

  private mapRow(row: CrmActivityItemDto): Record<string, unknown> {
    return {
      customer_name: row.customer?.display_name || `#${row.customer_id}`,
      seller_name: row.user?.display_name || '',
      type_label: TYPE_LABELS[row.type] ?? row.type,
      title: row.title ?? '',
      description: row.description ?? '',
      notes: row.notes ?? '',
      status_label: STATUS_LABELS[row.status] ?? row.status,
      activity_date: formatExportDate(row.activity_date),
      follow_up_date: formatExportDate(row.follow_up_date),
      duration_minutes: row.duration_minutes ?? '',
      outcome_label: row.outcome
        ? (OUTCOME_LABELS[row.outcome] ?? row.outcome)
        : '',
      is_overdue: row.is_overdue_follow_up ? 'Sí' : 'No',
      created_at: formatExportDateTime(row.created_at),
    };
  }

  private filterSubtitle(query: QueryCrmActivityDto): string {
    const parts: string[] = [];
    if (query.search?.trim()) {
      parts.push(`Búsqueda: ${query.search.trim()}`);
    }
    if (query.type) {
      parts.push(`Tipo: ${TYPE_LABELS[query.type] ?? query.type}`);
    }
    if (query.status) {
      parts.push(`Estado: ${STATUS_LABELS[query.status] ?? query.status}`);
    }
    if (query.attention) {
      parts.push(`Atención: ${ATTENTION_LABELS[query.attention]}`);
    }
    return parts.join('  •  ');
  }
}
