import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ComprobantesStorageService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.bucket = this.config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
    this.client = createClient(supabaseUrl, serviceRoleKey);
  }

  /**
   * Sube el PDF al bucket de Supabase Storage y devuelve su URL pública.
   * Hard-fail: lanza un error si la subida falla.
   */
  async subirPdf(idIntercambio: number, pdf: Buffer): Promise<string> {
    const path = `comprobantes/${idIntercambio}.pdf`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
