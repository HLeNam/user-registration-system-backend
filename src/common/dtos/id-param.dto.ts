import { IsUUID, IsNotEmpty } from 'class-validator';

export class IdParamDto {
  @IsUUID('4', { message: 'id must be a valid UUID' })
  @IsNotEmpty({ message: 'id should not be empty' })
  id: string;
}
