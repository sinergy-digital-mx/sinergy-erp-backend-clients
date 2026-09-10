"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmReportPeriod = exports.CrmAttentionFilter = exports.CrmActivityAuthorsResponseDto = exports.CrmActivityStatsResponseDto = exports.CrmActivityListResponseDto = exports.CrmActivityAuthorDto = exports.CrmActivityItemDto = exports.CrmActivityCustomerDto = exports.CrmActivityUserDto = void 0;
const query_crm_activity_dto_1 = require("./query-crm-activity.dto");
Object.defineProperty(exports, "CrmAttentionFilter", { enumerable: true, get: function () { return query_crm_activity_dto_1.CrmAttentionFilter; } });
Object.defineProperty(exports, "CrmReportPeriod", { enumerable: true, get: function () { return query_crm_activity_dto_1.CrmReportPeriod; } });
class CrmActivityUserDto {
    id;
    first_name;
    last_name;
    email;
    display_name;
}
exports.CrmActivityUserDto = CrmActivityUserDto;
class CrmActivityCustomerDto {
    id;
    name;
    lastname;
    company_name;
    display_name;
}
exports.CrmActivityCustomerDto = CrmActivityCustomerDto;
class CrmActivityItemDto {
    id;
    customer_id;
    customer;
    user_id;
    user;
    type;
    status;
    title;
    description;
    notes;
    activity_date;
    follow_up_date;
    duration_minutes;
    outcome;
    is_overdue_follow_up;
    created_at;
    updated_at;
}
exports.CrmActivityItemDto = CrmActivityItemDto;
class CrmActivityAuthorDto {
    id;
    first_name;
    last_name;
    email;
    display_name;
    activity_count;
}
exports.CrmActivityAuthorDto = CrmActivityAuthorDto;
class CrmActivityListResponseDto {
    activities;
    total;
    page;
    limit;
    totalPages;
    hasNext;
    hasPrev;
    is_crm_admin;
}
exports.CrmActivityListResponseDto = CrmActivityListResponseDto;
class CrmActivityStatsResponseDto {
    is_crm_admin;
    period;
    totals;
    attention;
}
exports.CrmActivityStatsResponseDto = CrmActivityStatsResponseDto;
class CrmActivityAuthorsResponseDto {
    is_crm_admin;
    authors;
}
exports.CrmActivityAuthorsResponseDto = CrmActivityAuthorsResponseDto;
//# sourceMappingURL=crm-activity-response.dto.js.map