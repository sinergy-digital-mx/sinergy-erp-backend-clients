"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmInboxExportService = void 0;
const common_1 = require("@nestjs/common");
const customer_activity_entity_1 = require("../../../entities/customers/customer-activity.entity");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const query_crm_activity_dto_1 = require("../dto/query-crm-activity.dto");
const crm_inbox_service_1 = require("./crm-inbox.service");
const TYPE_LABELS = {
    [customer_activity_entity_1.CustomerActivityType.NOTE]: 'Nota',
    [customer_activity_entity_1.CustomerActivityType.CALL]: 'Llamada',
    [customer_activity_entity_1.CustomerActivityType.EMAIL]: 'Correo',
    [customer_activity_entity_1.CustomerActivityType.MEETING]: 'Reunión',
    [customer_activity_entity_1.CustomerActivityType.TASK]: 'Tarea',
    [customer_activity_entity_1.CustomerActivityType.FOLLOW_UP]: 'Seguimiento',
    [customer_activity_entity_1.CustomerActivityType.PURCHASE]: 'Compra',
    [customer_activity_entity_1.CustomerActivityType.SUPPORT]: 'Soporte',
};
const STATUS_LABELS = {
    [customer_activity_entity_1.CustomerActivityStatus.COMPLETED]: 'Completada',
    [customer_activity_entity_1.CustomerActivityStatus.SCHEDULED]: 'Programada',
    [customer_activity_entity_1.CustomerActivityStatus.CANCELLED]: 'Cancelada',
    [customer_activity_entity_1.CustomerActivityStatus.IN_PROGRESS]: 'En progreso',
};
const OUTCOME_LABELS = {
    satisfied: 'Satisfecho',
    issue_resolved: 'Problema resuelto',
    escalated: 'Escalado',
    follow_up_needed: 'Requiere seguimiento',
};
const ATTENTION_LABELS = {
    [query_crm_activity_dto_1.CrmAttentionFilter.FOLLOW_UP_PENDING]: 'Seguimientos pendientes',
    [query_crm_activity_dto_1.CrmAttentionFilter.FOLLOW_UP_OVERDUE]: 'Seguimientos vencidos',
    [query_crm_activity_dto_1.CrmAttentionFilter.CALL_PENDING]: 'Llamadas pendientes',
    [query_crm_activity_dto_1.CrmAttentionFilter.TASK_PENDING]: 'Tareas pendientes',
};
let CrmInboxExportService = class CrmInboxExportService {
    inboxService;
    columns = [
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
    constructor(inboxService) {
        this.inboxService = inboxService;
    }
    async exportExcel(tenantId, actorUserId, hasAdminRole, query) {
        const { activities, period_label } = await this.inboxService.listForExport(tenantId, actorUserId, hasAdminRole, query);
        const rows = activities.map((row) => this.mapRow(row));
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Actividades',
            title: 'Reporte CRM — Actividades',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Periodo: ${period_label}`,
                this.filterSubtitle(query),
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Registros: ${rows.length}`,
            ]),
            columns: this.columns,
            rows,
            headerColor: 'FF4F46E5',
            titleColor: 'FF3730A3',
        });
    }
    getFilename() {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `crm-actividades-${y}-${m}-${d}.xlsx`;
    }
    mapRow(row) {
        return {
            customer_name: row.customer?.display_name || `#${row.customer_id}`,
            seller_name: row.user?.display_name || '',
            type_label: TYPE_LABELS[row.type] ?? row.type,
            title: row.title ?? '',
            description: row.description ?? '',
            notes: row.notes ?? '',
            status_label: STATUS_LABELS[row.status] ?? row.status,
            activity_date: (0, excel_export_util_1.formatExportDate)(row.activity_date),
            follow_up_date: (0, excel_export_util_1.formatExportDate)(row.follow_up_date),
            duration_minutes: row.duration_minutes ?? '',
            outcome_label: row.outcome
                ? (OUTCOME_LABELS[row.outcome] ?? row.outcome)
                : '',
            is_overdue: row.is_overdue_follow_up ? 'Sí' : 'No',
            created_at: (0, excel_export_util_1.formatExportDateTime)(row.created_at),
        };
    }
    filterSubtitle(query) {
        const parts = [];
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
};
exports.CrmInboxExportService = CrmInboxExportService;
exports.CrmInboxExportService = CrmInboxExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_inbox_service_1.CrmInboxService])
], CrmInboxExportService);
//# sourceMappingURL=crm-inbox-export.service.js.map