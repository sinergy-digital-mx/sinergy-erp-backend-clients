export declare enum PosUserType {
    VENTAS = "VENTAS",
    COBRANZA = "COBRANZA",
    AMBOS = "AMBOS"
}
export declare const POS_SELL_TYPES: PosUserType[];
export declare const POS_COLLECT_TYPES: PosUserType[];
export declare function canPosSell(type?: PosUserType | null): boolean;
export declare function canPosCollect(type?: PosUserType | null): boolean;
export declare function canCoverPosCaja(user: {
    is_pos_user?: boolean | number | null;
    pos_user_type?: PosUserType | null;
}): boolean;
