import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChannelPaths } from './useChannelPaths';
import * as useChannelHook from './useChannel';

// Mock useChannel
vi.mock('./useChannel', () => ({
  useChannel: vi.fn(),
}));

describe('useChannelPaths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve manter o caminho original no modo legado', () => {
    vi.mocked(useChannelHook.useChannel).mockReturnValue({
      isChannelMode: false,
      channel: 'app',
      company: null,
      isCompanyScoped: true,
      isGlobalChannel: false,
      isLoading: false,
      isDevOrPreview: false,
    });

    const { result } = renderHook(() => useChannelPaths());
    const path = '/franqueado/arquivos/123';
    const legacyPrefix = '/franqueado';
    
    expect(result.current.resolve(path, legacyPrefix)).toBe(path);
  });

  it('deve remover o prefixo no modo canal', () => {
    vi.mocked(useChannelHook.useChannel).mockReturnValue({
      isChannelMode: true,
      channel: 'app',
      company: { id: '1', name: 'Injediesel' } as any,
      isCompanyScoped: true,
      isGlobalChannel: false,
      isLoading: false,
      isDevOrPreview: false,
    });

    const { result } = renderHook(() => useChannelPaths());
    const path = '/franqueado/arquivos/123';
    const legacyPrefix = '/franqueado';
    
    // /franqueado/arquivos/123 -> /arquivos/123
    expect(result.current.resolve(path, legacyPrefix)).toBe('/arquivos/123');
  });

  it('deve retornar "/" se o caminho for igual ao prefixo legado no modo canal', () => {
    vi.mocked(useChannelHook.useChannel).mockReturnValue({
      isChannelMode: true,
      channel: 'app',
      company: { id: '1', name: 'Injediesel' } as any,
      isCompanyScoped: true,
      isGlobalChannel: false,
      isLoading: false,
      isDevOrPreview: false,
    });

    const { result } = renderHook(() => useChannelPaths());
    const path = '/franqueado';
    const legacyPrefix = '/franqueado';
    
    expect(result.current.resolve(path, legacyPrefix)).toBe('/');
  });

  it('não deve alterar caminhos que não começam com o prefixo legado no modo canal', () => {
    vi.mocked(useChannelHook.useChannel).mockReturnValue({
      isChannelMode: true,
      channel: 'app',
      company: { id: '1', name: 'Injediesel' } as any,
      isCompanyScoped: true,
      isGlobalChannel: false,
      isLoading: false,
      isDevOrPreview: false,
    });

    const { result } = renderHook(() => useChannelPaths());
    const path = '/outro-caminho/123';
    const legacyPrefix = '/franqueado';
    
    expect(result.current.resolve(path, legacyPrefix)).toBe(path);
  });
});
