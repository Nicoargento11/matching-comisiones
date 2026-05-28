import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoDto {
  @ApiProperty({ enum: ['POR_HACER', 'EN_PROGRESO', 'COMPLETADO'], example: 'EN_PROGRESO' })
  @IsEnum(['POR_HACER', 'EN_PROGRESO', 'COMPLETADO'])
  estado: string;
}
