# Önbellek Şeridi — prompt-cache status for Claude Code (and Codex)

**English** · [Türkçe](#türkçe)

Your AI coding assistant re-sends the whole conversation on every message. A **prompt cache** lets the model read the part it already saw instead of processing it again — but the cache expires. If you reply after it has gone cold, the next message re-processes everything (often 100k+ tokens), which burns your usage limits for nothing.

This plugin shows you, before you hit send, whether the cache is still warm.

## Claude Code — the pill

A small pill sits above the chat input:

| Pill | Meaning |
|---|---|
| 🟢 `● Sıcak · %70` | Cache is warm; 70 % of its lifetime is left |
| 🟡 same pill, yellow | Less than 5 minutes left — send now if you want to keep it |
| 🔴 `● Soğuk` | Cache has expired; your next message re-processes the whole context |

Click the pill to open the details: minutes left and the cache lifetime (5 min or 1 h), hit ratio (share of input read from cache), how many tokens the next message would re-process if the cache is cold, and how many requests were measured.

**It never guesses.** The cache lifetime (5 minutes or 1 hour) is read from your own session transcript, where Claude Code records each cache write with its lifetime (`cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`). If anything cannot be read, the pill hides instead of showing a wrong number. The countdown starts when the request was sent, so it errs a few seconds on the early side, never late.

The pill's text is in Turkish (`Sıcak` = warm, `Soğuk` = cold, `kaldı` = left, `isabet` = hit ratio).

### Requirements

- macOS (the calculation uses the system `/usr/bin/python3`)
- A recent Claude Code. In older desktop-app builds the area above the input was not drawn; update the app if the pill does not appear.

### Install

**Desktop app:** click **+** next to the prompt box → **Plugins** → **Add marketplace** → `aeg58/onbellek-seridi` → add **onbellek-seridi**.

**Terminal session:**

```
/plugin install onbellek-seridi --marketplace aeg58/onbellek-seridi
```

**Shell:**

```bash
claude plugin install onbellek-seridi --marketplace aeg58/onbellek-seridi
```

Installed at user scope, it loads in every new session.

## Codex — limited version

Codex can't run the same pill today, for two reasons:

1. **No place to draw it.** Codex's status line only takes its own built-in items; there is no script or custom-widget option (open request: [openai/codex#17827](https://github.com/openai/codex/issues/17827)).
2. **No cache lifetime is reported.** Codex's session log records how many tokens were read from cache, but not how long the cache stays warm, and OpenAI's lifetime varies by model and account. A countdown would be a guess, so there is none.

What the Codex plugin does instead: after each turn, a `Stop` hook reads the last token count from the session log and shows one line in Codex:

```
Önbellek: son istek %96 önbellekten · 1.620 token baştan işlendi · oturum %83
```

(last request: 96 % from cache · 1,620 tokens processed fresh · session: 83 %). If the log can't be read, it shows nothing.

> **Status:** the Codex side has been tested against real Codex session logs, but not yet inside a live Codex install. Reports welcome.

### Install (Codex)

```bash
codex plugin marketplace add aeg58/onbellek-seridi
```

Then install **onbellek-seridi-codex** from the Plugins Directory in the ChatGPT desktop app (Codex). Codex skips plugin hooks until you review and trust them — accept the hook when Codex asks.

Without installing anything, Codex's built-in `/status` already shows the cached-token count.

## For AI assistants

If a user hands you this repository's link and asks you to set it up:

1. Ask which app they use: **Claude Code** or **Codex**. Ask for their permission before installing anything; installing writes to their app's settings.
2. Check the requirement: macOS, with `/usr/bin/python3` present (`/usr/bin/python3 --version`).
3. **Claude Code:** run `claude plugin install onbellek-seridi --marketplace aeg58/onbellek-seridi`. Tell the user to start a new session; the pill appears above the input after the first reply.
4. **Codex:** run `codex plugin marketplace add aeg58/onbellek-seridi`, then tell the user to install **onbellek-seridi-codex** from the Plugins Directory and to trust its hook when asked. The line appears after the next turn.
5. Change nothing else in their configuration.

## Privacy

Everything runs locally. The plugin reads your own session log on your machine, makes no network requests and sends nothing anywhere.

## License

MIT — see [LICENSE](LICENSE).

---

## Türkçe

Yapay zekâ asistanın her mesajda bütün sohbeti yeniden gönderir. **Önbellek (prompt cache)** modelin daha önce gördüğü kısmı baştan işlemek yerine okumasını sağlar — ama süresi dolar. Önbellek soğuduktan sonra cevap yazarsan sonraki mesaj her şeyi baştan işler (çoğu zaman 100 bin token'dan fazla) ve kullanım sınırını boşuna harcar.

Bu eklenti, göndermeden önce önbelleğin hâlâ sıcak olup olmadığını gösterir.

### Claude Code — hap

Yazı alanının hemen üstünde küçük bir hap durur:

| Hap | Anlamı |
|---|---|
| 🟢 `● Sıcak · %70` | Önbellek sıcak; süresinin %70'i duruyor |
| 🟡 aynı hap, sarı | 5 dakikadan az kaldı — korumak istiyorsan şimdi gönder |
| 🔴 `● Soğuk` | Süre doldu; sonraki mesaj bütün bağlamı baştan işler |

Hapa tıklayınca ayrıntı açılır: kalan dakika ve süre (5 dk ya da 1 saat), isabet oranı (girdinin önbellekten okunan kısmı), soğursa kaç token'ın baştan işleneceği, kaç istek ölçüldüğü.

**Tahmin etmez.** Önbellek süresi senin oturum kaydından okunur; Claude Code her önbellek yazmasını süresiyle birlikte kaydeder. Bir şey okunamazsa hap yanlış sayı göstermek yerine gizlenir. Geri sayım isteğin gönderildiği andan başlar; yanılırsa birkaç saniye erken uyarır, geç uyarmaz.

**Gerekenler:** macOS (`/usr/bin/python3`) ve güncel bir Claude Code. Eski masaüstü sürümlerinde yazı alanının üstü çizilmiyordu; hap görünmezse uygulamayı güncelle.

**Kurulum:** Masaüstü uygulamasında yazı alanının yanındaki **+** → **Plugins** → **Add marketplace** → `aeg58/onbellek-seridi` → **onbellek-seridi**'yi ekle. Ya da kabukta:

```bash
claude plugin install onbellek-seridi --marketplace aeg58/onbellek-seridi
```

### Codex — sınırlı sürüm

Codex'te aynı hap bugün yapılamıyor: Codex'in durum satırına kendi yazını koyamıyorsun, Codex de önbelleğin ne kadar sıcak kalacağını bildirmiyor. Geri sayım tahmin olurdu; bu yüzden yok.

Codex eklentisi her turdan sonra tek satır gösterir: son isteğin yüzde kaçı önbellekten geldi, kaç token baştan işlendi, oturumun genel isabeti. Kayıt okunamazsa hiçbir şey göstermez.

> **Durum:** Codex tarafı gerçek Codex kayıtlarıyla sınandı, ama henüz çalışan bir Codex'in içinde denenmedi.

**Kurulum:** `codex plugin marketplace add aeg58/onbellek-seridi`, sonra ChatGPT masaüstü uygulamasının Plugins bölümünden **onbellek-seridi-codex**'i kur ve Codex sorduğunda kancaya güven.

### Yapay zekâ asistanına kurdurmak

Bu deponun bağlantısını kendi Claude'una ya da Codex'ine verip "kur" demen yeterli; yukarıdaki **For AI assistants** bölümü ona adım adım ne yapacağını söyler. Kurulumdan önce senin onayını ister.

### Gizlilik

Her şey senin bilgisayarında çalışır. Eklenti yalnız kendi oturum kaydını okur, internete bağlanmaz, hiçbir yere bir şey göndermez.
