import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ComprobantesStorageService } from './comprobantes-storage.service';

// Mock @supabase/supabase-js
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

describe('ComprobantesStorageService', () => {
  let service: ComprobantesStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprobantesStorageService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const map: Record<string, string> = {
                SUPABASE_URL: 'https://example.supabase.co',
                SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
                SUPABASE_STORAGE_BUCKET: 'comprobantes',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ComprobantesStorageService>(ComprobantesStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when upload returns an error', async () => {
    mockUpload.mockResolvedValue({ error: { message: 'Storage unavailable' } });

    await expect(service.subir(1, Buffer.from('pdf'))).rejects.toThrow(
      'Storage upload failed: Storage unavailable',
    );
  });

  it('returns the public URL on success', async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/comprobantes/1.pdf' } });

    const url = await service.subir(1, Buffer.from('pdf'));

    expect(url).toBe('https://cdn.example.com/comprobantes/1.pdf');
  });
});
