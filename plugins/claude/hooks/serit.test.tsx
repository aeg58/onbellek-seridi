import { expect, test } from 'claude-code/testing'

const SIMDI = 1_800_000_000_000
const BAND = {
  plugin: 'onbellek-seridi',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 100, scroll: { offset: 0, bodyRows: 5 }, view: {} },
} as const

// Motorun yerine geçen kancalar: hesap betiğinin çıktısı `cikti` olarak verilir.
function kur(on: any, cikti: object | null) {
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('clock.now', () => ({ value: SIMDI }))
  on('clock.every', () => ({ value: {} }))
  on('ui.status', () => ({ value: undefined }))
  // Şerit çizmezse motorun yerine bu çizer.
  on('ui.render', ($: any, e: any) => {
    const { Text } = $.ui.resolve(e)
    return <Text>motor</Text>
  })
  on('env.get', () => ({ value: '/Users/x' }))
  on('session.id', () => ({ value: 'abc' }))
  on('session.cwd', () => ({ value: '/p' }))
  on('fs.stat', () => ({ value: { mtimeMs: 1, size: 1, kind: 'file' } }))
  on('process.run', () => ({
    value: cikti === null
      ? { exitCode: 1, stdout: '', stderr: 'x', isStdoutTruncated: false, isStderrTruncated: false }
      : { exitCode: 0, stdout: JSON.stringify(cikti), stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }))
}

async function hap($: any, surface: 'terminal' | 'desktop') {
  const ui = await $.ui.mount({ ...BAND, surface })
  const t = await ui.find({ type: 'Text', text: /●/ })
  await ui.unmount()
  return t?.text
}

test('1 saatlik önbellek, 18 dk önce: yeşil, %70', async ($, on) => {
  kur(on, { ok: true, onbellek_yok: false, sure_sn: 3600, son_ms: SIMDI - 18 * 60000, isabet: 0.92, yeniden_token: 84000, istek: 10 })
  await $.session.start({ cwd: '/p', surface: 'desktop', isInteractive: true })
  for (const s of ['terminal', 'desktop'] as const) {
    expect(await hap($, s)).toBe('● Sıcak · %70')
  }
})

test('tıklanınca ayrıntı açılır, yeniden tıklanınca kapanır', async ($, on) => {
  kur(on, { ok: true, onbellek_yok: false, sure_sn: 3600, son_ms: SIMDI - 18 * 60000, isabet: 0.92, yeniden_token: 84000, istek: 10 })
  await $.session.start({ cwd: '/p', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /Kalan/ }))?.text).toBe(undefined)
  await ui.press({ key: 'hap' })
  expect((await ui.find({ type: 'Text', text: /Kalan/ }))?.text).toBe('Kalan: 42 dk (süre 1 saat). Yüzde, sürenin ne kadarının kaldığı.')
  expect((await ui.find({ type: 'Text', text: /İsabet/ }))?.text).toBe('İsabet: %92 (gönderilenin önbellekten okunan kısmı)')
  expect((await ui.find({ type: 'Text', text: /Soğursa/ }))?.text).toBe("Soğursa sonraki mesaj ~84 bin token'ı baştan işler")
  await ui.press({ key: 'hap' })
  expect((await ui.find({ type: 'Text', text: /Kalan/ }))?.text).toBe(undefined)
  await ui.unmount()
})

test('5 dakikalık önbellek, 7 dk önce: soğuk', async ($, on) => {
  kur(on, { ok: true, onbellek_yok: false, sure_sn: 300, son_ms: SIMDI - 7 * 60000, isabet: 0.81, yeniden_token: 84000 })
  await $.session.start({ cwd: '/p', surface: 'desktop', isInteractive: true })
  expect(await hap($, 'desktop')).toBe('● Soğuk')
})

test('5 dakikalık önbellek, 2 dk önce: sarı bölgede değil, %60', async ($, on) => {
  kur(on, { ok: true, onbellek_yok: false, sure_sn: 300, son_ms: SIMDI - 2 * 60000, isabet: 0.5, yeniden_token: 1000 })
  await $.session.start({ cwd: '/p', surface: 'desktop', isInteractive: true })
  expect(await hap($, 'desktop')).toBe('● Sıcak · %60')
})

test('süre kayıtta yoksa hap hiç görünmez', async ($, on) => {
  kur(on, { ok: false, neden: 'onbellek suresi kayitta yok' })
  await $.session.start({ cwd: '/p', surface: 'desktop', isInteractive: true })
  expect(await hap($, 'desktop')).toBe(undefined)
})

test('hesap betiği hata verirse hap hiç görünmez', async ($, on) => {
  kur(on, null)
  await $.session.start({ cwd: '/p', surface: 'desktop', isInteractive: true })
  expect(await hap($, 'desktop')).toBe(undefined)
})
