import { Body, Controller, Get, Header, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SelfInvoiceService } from './self-invoice.service';
import { IdentifySelfInvoiceDto } from './dto/identify-self-invoice.dto';
import { StampSelfInvoiceDto } from './dto/stamp-self-invoice.dto';

@ApiTags('Self Invoice Portal')
@Controller('public/self-invoice')
export class SelfInvoiceController {
  constructor(private readonly selfInvoiceService: SelfInvoiceService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Vista previa pública del recibo (total, emisor, si ya está facturado)' })
  getReceipt(@Param('code') code: string) {
    return this.selfInvoiceService.getReceipt(code);
  }

  @Post(':code/identify')
  @ApiOperation({ summary: 'Buscar datos fiscales por correo y teléfono' })
  identify(@Param('code') code: string, @Body() dto: IdentifySelfInvoiceDto) {
    return this.selfInvoiceService.identify(code, dto);
  }

  @Post(':code/stamp')
  @ApiOperation({ summary: 'Timbrar CFDI 4.0 desde el portal del cliente' })
  stamp(@Param('code') code: string, @Body() dto: StampSelfInvoiceDto) {
    return this.selfInvoiceService.stamp(code, dto);
  }

  @Get(':code/invoice/pdf')
  @ApiOperation({ summary: 'URL firmada del PDF timbrado' })
  getPdf(@Param('code') code: string) {
    return this.selfInvoiceService.getInvoicePdf(code);
  }

  @Get(':code/invoice/xml')
  @ApiOperation({ summary: 'Descargar XML timbrado' })
  @Header('Content-Type', 'application/xml')
  async getXml(@Param('code') code: string, @Res() res: any) {
    const { xml, fileName } = await this.selfInvoiceService.getInvoiceXml(code);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(xml);
  }
}
