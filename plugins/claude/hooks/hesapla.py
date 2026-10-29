"""Oturum kaydindan ana sohbetin onbellek durumunu hesaplar, JSON basar.

Kullanim: hesapla.py <projeler-klasoru> <oturum-id>
Bilgi eksik ya da belirsizse {"ok": false, "neden": ...} basar; serit o zaman gizlenir.
"""
import glob
import json
import os
import sys
from datetime import datetime


def zaman_ms(s):
    return int(datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp() * 1000)


def cikis(**d):
    print(json.dumps(d))
    sys.exit(0)


def main():
    projeler, oturum = sys.argv[1], sys.argv[2]
    adaylar = glob.glob(os.path.join(projeler, "*", oturum + ".jsonl"))
    if len(adaylar) != 1:
        cikis(ok=False, neden="kayit bulunamadi" if not adaylar else "birden cok kayit")

    istekler = {}  # requestId -> {gonderim_ms, usage}
    onceki_ms = None
    with open(adaylar[0], encoding="utf-8") as f:
        for satir in f:
            try:
                d = json.loads(satir)
            except ValueError:
                continue
            ts = d.get("timestamp")
            ms = zaman_ms(ts) if isinstance(ts, str) else None
            m = d.get("message")
            u = m.get("usage") if isinstance(m, dict) else None
            if d.get("type") == "assistant" and not d.get("isSidechain") and isinstance(u, dict):
                anahtar = d.get("requestId") or m.get("id")
                if anahtar not in istekler:
                    # Istegin gonderildigi an: ilk satirindan onceki kaydin saati
                    # (cevap yazilirken gecen sureyi kalan sureye katmamak icin).
                    istekler[anahtar] = {"gonderim_ms": onceki_ms or ms}
                istekler[anahtar]["usage"] = u
            if ms is not None:
                onceki_ms = ms

    if not istekler:
        cikis(ok=False, neden="henuz cevap yok")

    okunan = yazilan = taze = 0
    son_sure = None  # en son onbellege yazmanin suresi (saniye)
    for i in istekler.values():
        u = i["usage"]
        okunan += u.get("cache_read_input_tokens") or 0
        yazilan += u.get("cache_creation_input_tokens") or 0
        taze += u.get("input_tokens") or 0
        if (u.get("cache_creation_input_tokens") or 0) > 0:
            cc = u.get("cache_creation")
            if not isinstance(cc, dict):
                son_sure = None  # suresi kayitta yok: bilinmiyor
                continue
            bes = cc.get("ephemeral_5m_input_tokens") or 0
            saat = cc.get("ephemeral_1h_input_tokens") or 0
            # Iki sureli yazma varsa kisa olani esas al: o kisim once soguyor.
            son_sure = 300 if bes > 0 else (3600 if saat > 0 else None)

    son = list(istekler.values())[-1]
    u = son["usage"]
    son_okunan = u.get("cache_read_input_tokens") or 0
    son_yazilan = u.get("cache_creation_input_tokens") or 0
    toplam = okunan + yazilan + taze
    yeniden = (u.get("input_tokens") or 0) + son_okunan + son_yazilan + (u.get("output_tokens") or 0)

    if son_okunan == 0 and son_yazilan == 0:
        # Son istek onbellege hic dokunmadi: onbellek yok sayilir.
        cikis(ok=True, onbellek_yok=True, isabet=okunan / toplam if toplam else None,
              yeniden_token=yeniden, istek=len(istekler))
    if son_sure is None or son["gonderim_ms"] is None:
        cikis(ok=False, neden="onbellek suresi kayitta yok")

    cikis(ok=True, onbellek_yok=False, sure_sn=son_sure, son_ms=son["gonderim_ms"],
          isabet=okunan / toplam if toplam else None, yeniden_token=yeniden,
          istek=len(istekler))


main()
