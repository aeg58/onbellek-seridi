// hesapla.py'nin bastığı sonuç; ok false ise şerit gizlenir.
export type Durum = {
  ok: boolean
  onbellek_yok?: boolean
  sure_sn?: number
  son_ms?: number
  isabet?: number | null
  yeniden_token?: number
  istek?: number
  neden?: string
}

declare module 'claude-code' {
  interface PluginState {
    'onbellek-seridi': { durum: Durum | null; simdi: number; acik: boolean }
  }
}
