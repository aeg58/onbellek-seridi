import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Durum } from '../types'

const durum = atom({ plugin: 'onbellek-seridi', key: 'durum' } as const, null)
const simdi = atom({ plugin: 'onbellek-seridi', key: 'simdi' } as const, 0)
const acik = atom({ plugin: 'onbellek-seridi', key: 'acik' } as const, false)

const binlik = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)} bin` : `${n}`)
const yuzde = (x: number) => `%${Math.floor(x * 100)}`

let sonDegisiklik = -1

// Masaüstü tema adlarını (success…) boyamadı; açık renk kodu verilir.
const YESIL = '#16a34a'
const SARI = '#d97706'
const KIRMIZI = '#dc2626'

type Gorunum = {
  hap: string
  renk: string
  ayrinti: string[]
}

// Hapın yazısı, rengi ve tıklanınca açılan satırlar; bilgi yoksa ya da güvenilmezse null (hiçbir şey gösterilmez).
function gorunum(d: Durum | null, an: number): Gorunum | null {
  if (!d || !d.ok) return null
  const ortak: string[] = []
  if (d.isabet != null) ortak.push(`İsabet: ${yuzde(d.isabet)} (gönderilenin önbellekten okunan kısmı)`)
  if (d.yeniden_token) ortak.push(`Soğursa sonraki mesaj ~${binlik(d.yeniden_token)} token'ı baştan işler`)
  if (d.istek) ortak.push(`Ölçüm: bu oturumun kaydı, ${d.istek} istek`)

  if (d.onbellek_yok || d.sure_sn === undefined || d.son_ms === undefined) {
    return { hap: '● Önbellek yok', renk: KIRMIZI, ayrinti: ['Son istek önbelleği hiç kullanmadı.', ...ortak] }
  }
  const sureMs = d.sure_sn * 1000
  const kalanMs = d.son_ms + sureMs - an
  const sure = d.sure_sn >= 3600 ? '1 saat' : `${Math.round(d.sure_sn / 60)} dakika`
  if (kalanMs <= 0) {
    const dk = Math.floor(-kalanMs / 60000)
    return { hap: '● Soğuk', renk: KIRMIZI, ayrinti: [`Önbellek ${dk} dk önce soğudu (süre ${sure}).`, ...ortak] }
  }
  const kalanDk = Math.floor(kalanMs / 60000)
  const kalan = kalanDk < 1 ? '1 dakikadan az' : `${kalanDk} dk`
  return {
    hap: `● Sıcak · ${yuzde(kalanMs / sureMs)}`,
    renk: kalanMs < 5 * 60000 ? SARI : YESIL,
    ayrinti: [`Kalan: ${kalan} (süre ${sure}). Yüzde, sürenin ne kadarının kaldığı.`, ...ortak],
  }
}

// Oturum kaydı değiştiyse hesabı yeniden yapar; okunamazsa hapı gizler.
async function yenile($: EngineInterface) {
  const an = await $.clock.now()
  await update($, simdi, () => an)
  try {
    const home = await $.env.get('HOME')
    const id = await $.session.id()
    if (!home) throw new Error('HOME yok')
    const projeler = `${home}/.claude/projects`
    const kayit = `${projeler}/${(await $.session.cwd()).replace(/[^a-zA-Z0-9]/g, '-')}/${id}.jsonl`
    const st = await $.fs.stat(kayit).catch(() => null)
    if (st && st.mtimeMs === sonDegisiklik) return
    const r = await $.process.run(
      ['/usr/bin/python3', '-I', `${$.plugin.root}/hooks/hesapla.py`, projeler, id],
      { timeoutMs: 20000 },
    )
    const d: Durum = r.exitCode === 0 ? JSON.parse(r.stdout) : { ok: false, neden: 'hesap hatası' }
    if (st) sonDegisiklik = st.mtimeMs
    await update($, durum, () => d)
  } catch {
    await update($, durum, () => null)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const sonuc = await next(e)
    $.ui.status(undefined) // önceki sürümün alt satırını temizler
    void yenile($)
    $.clock.every(20000, () => void yenile($))
    return sonuc
  })

  on('turn.complete', async ($, e, next) => {
    const sonuc = await next(e)
    if (e.agentId === undefined) void yenile($)
    return sonuc
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const g = gorunum(await read($, durum), await read($, simdi))
    if (e.props.hasSurvey || !g) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const isOpen = await read($, acik)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row">
          <Button key="hap" plain onPress={() => update($, acik, v => !v)}>
            <Text color={g.renk} weight="semibold">{g.hap}</Text>
          </Button>
        </Box>
        {isOpen && g.ayrinti.map(s => <Text dimColor>{s}</Text>)}
      </Box>
    )
  })
}
