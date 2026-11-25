"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosCajaRecallHub = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const pos_caja_recall_util_1 = require("./utils/pos-caja-recall.util");
const NOTICE_TTL_MS = 2 * 60 * 1000;
let PosCajaRecallHub = class PosCajaRecallHub {
    events$ = new rxjs_1.Subject();
    recent = new Map();
    publish(event) {
        const full = this.build(event, 'recalled');
        this.recent.set(this.key(full.tenantId, full.kind, full.id), full);
        this.prune();
        this.events$.next(full);
        return full;
    }
    publishArrived(event) {
        const full = this.build({ ...event, recalledByName: '' }, 'arrived');
        this.events$.next(full);
        return full;
    }
    find(tenantId, kind, id) {
        this.prune();
        return this.recent.get(this.key(tenantId, kind, id)) ?? null;
    }
    messageFor(tenantId, kind, id, folio) {
        const notice = this.find(tenantId, kind, id);
        return (0, pos_caja_recall_util_1.cajaRecallMessage)(notice?.recalledByName, notice?.folio || folio);
    }
    stream(tenantId, branchId) {
        return this.events$.pipe((0, operators_1.filter)((event) => event.tenantId === tenantId && this.sameBranch(event.branchId, branchId)));
    }
    sameBranch(eventBranchId, listenerBranchId) {
        if (!eventBranchId || !listenerBranchId) {
            return true;
        }
        return eventBranchId === listenerBranchId;
    }
    build(event, type) {
        return {
            ...event,
            type,
            branchId: event.branchId || null,
            folio: (event.folio || '').trim() || event.id,
            recalledByName: (event.recalledByName || '').trim(),
            at: event.at ?? new Date().toISOString(),
        };
    }
    key(tenantId, kind, id) {
        return `${tenantId}:${kind}:${id}`;
    }
    prune() {
        const cutoff = Date.now() - NOTICE_TTL_MS;
        for (const [key, event] of this.recent) {
            if (new Date(event.at).getTime() < cutoff) {
                this.recent.delete(key);
            }
        }
    }
};
exports.PosCajaRecallHub = PosCajaRecallHub;
exports.PosCajaRecallHub = PosCajaRecallHub = __decorate([
    (0, common_1.Injectable)()
], PosCajaRecallHub);
//# sourceMappingURL=pos-caja-recall.hub.js.map