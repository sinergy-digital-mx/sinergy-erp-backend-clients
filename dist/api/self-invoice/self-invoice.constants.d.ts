export declare const SELF_INVOICE_USO_CFDI: readonly [{
    readonly value: "G01";
    readonly label: "G01 — Adquisición de mercancías";
}, {
    readonly value: "G03";
    readonly label: "G03 — Gastos en general";
}, {
    readonly value: "I01";
    readonly label: "I01 — Construcciones";
}, {
    readonly value: "I02";
    readonly label: "I02 — Mobiliario y equipo de oficina";
}, {
    readonly value: "I03";
    readonly label: "I03 — Equipo de transporte";
}, {
    readonly value: "I04";
    readonly label: "I04 — Equipo de cómputo";
}, {
    readonly value: "I08";
    readonly label: "I08 — Otra maquinaria y equipo";
}, {
    readonly value: "D01";
    readonly label: "D01 — Honorarios médicos";
}, {
    readonly value: "S01";
    readonly label: "S01 — Sin efectos fiscales";
}];
export declare const SELF_INVOICE_REGIMEN_RECEPTOR: readonly [{
    readonly value: "601";
    readonly label: "601 — General de Ley Personas Morales";
}, {
    readonly value: "603";
    readonly label: "603 — Personas Morales con Fines no Lucrativos";
}, {
    readonly value: "605";
    readonly label: "605 — Sueldos y Salarios";
}, {
    readonly value: "606";
    readonly label: "606 — Arrendamiento";
}, {
    readonly value: "608";
    readonly label: "608 — Demás ingresos";
}, {
    readonly value: "612";
    readonly label: "612 — Personas Físicas con Actividades Empresariales";
}, {
    readonly value: "616";
    readonly label: "616 — Sin obligaciones fiscales";
}, {
    readonly value: "621";
    readonly label: "621 — Incorporación Fiscal";
}, {
    readonly value: "625";
    readonly label: "625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas";
}, {
    readonly value: "626";
    readonly label: "626 — Régimen Simplificado de Confianza";
}];
export declare const SELF_INVOICE_FORMA_PAGO: readonly [{
    readonly value: "01";
    readonly label: "01 — Efectivo";
}, {
    readonly value: "03";
    readonly label: "03 — Transferencia electrónica";
}, {
    readonly value: "04";
    readonly label: "04 — Tarjeta de crédito";
}, {
    readonly value: "28";
    readonly label: "28 — Tarjeta de débito";
}, {
    readonly value: "99";
    readonly label: "99 — Por definir";
}];
export declare const SELF_INVOICE_CATALOGS: {
    uso_cfdi: readonly [{
        readonly value: "G01";
        readonly label: "G01 — Adquisición de mercancías";
    }, {
        readonly value: "G03";
        readonly label: "G03 — Gastos en general";
    }, {
        readonly value: "I01";
        readonly label: "I01 — Construcciones";
    }, {
        readonly value: "I02";
        readonly label: "I02 — Mobiliario y equipo de oficina";
    }, {
        readonly value: "I03";
        readonly label: "I03 — Equipo de transporte";
    }, {
        readonly value: "I04";
        readonly label: "I04 — Equipo de cómputo";
    }, {
        readonly value: "I08";
        readonly label: "I08 — Otra maquinaria y equipo";
    }, {
        readonly value: "D01";
        readonly label: "D01 — Honorarios médicos";
    }, {
        readonly value: "S01";
        readonly label: "S01 — Sin efectos fiscales";
    }];
    regimen_fiscal_receptor: readonly [{
        readonly value: "601";
        readonly label: "601 — General de Ley Personas Morales";
    }, {
        readonly value: "603";
        readonly label: "603 — Personas Morales con Fines no Lucrativos";
    }, {
        readonly value: "605";
        readonly label: "605 — Sueldos y Salarios";
    }, {
        readonly value: "606";
        readonly label: "606 — Arrendamiento";
    }, {
        readonly value: "608";
        readonly label: "608 — Demás ingresos";
    }, {
        readonly value: "612";
        readonly label: "612 — Personas Físicas con Actividades Empresariales";
    }, {
        readonly value: "616";
        readonly label: "616 — Sin obligaciones fiscales";
    }, {
        readonly value: "621";
        readonly label: "621 — Incorporación Fiscal";
    }, {
        readonly value: "625";
        readonly label: "625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas";
    }, {
        readonly value: "626";
        readonly label: "626 — Régimen Simplificado de Confianza";
    }];
    forma_pago: readonly [{
        readonly value: "01";
        readonly label: "01 — Efectivo";
    }, {
        readonly value: "03";
        readonly label: "03 — Transferencia electrónica";
    }, {
        readonly value: "04";
        readonly label: "04 — Tarjeta de crédito";
    }, {
        readonly value: "28";
        readonly label: "28 — Tarjeta de débito";
    }, {
        readonly value: "99";
        readonly label: "99 — Por definir";
    }];
    metodo_pago: {
        value: string;
        label: string;
    }[];
};
export declare const SAT_CLAVE_UNIDAD_BY_UOM: Record<string, string>;
export declare const DEFAULT_SAT_CLAVE_PROD_SERV = "01010101";
export declare const DEFAULT_SAT_CLAVE_UNIDAD = "H87";
