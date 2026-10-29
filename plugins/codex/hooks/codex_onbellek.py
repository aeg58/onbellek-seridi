"""Codex Stop kancasi: oturum kaydindaki son token sayimindan onbellek isabetini yazar.

Codex onbellek suresini bildirmedigi icin sicak/soguk ya da kalan sure gosterilmez.
Bilgi okunamazsa hicbir sey basmaz (Codex devam eder).
"""
import json
import sys


def binlik(n):
    return f"{n:,}".replace(",", ".")


def main():
    try:
        girdi = json.load(sys.stdin)
        yol = girdi.get("transcript_path")
        if not yol:
            return
        son = toplam = None
        with open(yol, encoding="utf-8") as f:
            for satir in f:
                if '"token_count"' not in satir:
                    continue
                try:
                    d = json.loads(satir)
                except ValueError:
                    continue
                p = d.get("payload") or {}
                info = p.get("info") if p.get("type") == "token_count" else None
                if isinstance(info, dict) and info.get("last_token_usage"):
                    son = info["last_token_usage"]
                    toplam = info.get("total_token_usage")
        if not son or not son.get("input_tokens"):
            return
        girdi_t = son["input_tokens"]
        onbellek = son.get("cached_input_tokens") or 0
        parca = [f"Önbellek: son istek %{int(onbellek * 100 / girdi_t)} önbellekten",
                 f"{binlik(girdi_t - onbellek)} token baştan işlendi"]
        if toplam and toplam.get("input_tokens"):
            parca.append(f"oturum %{int((toplam.get('cached_input_tokens') or 0) * 100 / toplam['input_tokens'])}")
        print(json.dumps({"systemMessage": " · ".join(parca)}, ensure_ascii=False))
    except Exception:
        return


main()
