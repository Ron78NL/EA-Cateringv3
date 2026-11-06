"""Videorobot: controleert of alle YouTube-video's van de app nog werken.

LEERMODUS - wat doet dit script?
GitHub start dit script elke maandagochtend vanzelf (zie videocheck.yml).
Het verzamelt alle YouTube-video's uit videos.js en, als die er is, uit de
gepubliceerde Google Sheet. Per video vraagt het YouTube via oEmbed:
"bestaat deze video nog, en mag hij in een andere website getoond worden?"
  - 200      -> in orde
  - 401/403  -> video bestaat, maar insluiten staat uit: speelt niet af in de app
  - 400/404  -> video verwijderd of privé gezet
Vindt het problemen, dan maakt de workflow een GitHub-melding (issue) aan.
Dat issue stuurt je een mail. Alles weer in orde? Dan sluit het issue vanzelf.
"""
import csv
import io
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (videocheck-robot)"}
VIDEO_ID = re.compile(r'id:\s*"([A-Za-z0-9_-]{11})"\s*,\s*titel:\s*"([^"]*)"')
LINK_ID = re.compile(r"(?:v=|youtu\.be/|shorts/|embed/)([A-Za-z0-9_-]{11})")


def uit_videos_js():
    p = pathlib.Path("videos.js")
    if not p.exists():
        return {}
    return {vid: (titel, "videos.js") for vid, titel in VIDEO_ID.findall(p.read_text(encoding="utf-8"))}


def uit_sheet(url):
    if not url:
        return {}
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        rijen = list(csv.reader(io.StringIO(r.read().decode("utf-8"))))
    gevonden = {}
    for i, rij in enumerate(rijen[1:], start=2):
        rij += [""] * (6 - len(rij))
        titel, link, tonen = rij[0].strip(), rij[3].strip(), rij[5].strip().lower()
        if tonen == "nee" or not (titel or link):
            continue
        m = LINK_ID.search(link)
        if m:
            gevonden[m.group(1)] = (titel, f"Google Sheet rij {i}")
        else:
            gevonden[f"rij{i}"] = (titel or "(geen titel)", f"Google Sheet rij {i}: geen geldige YouTube-link")
    return gevonden


def check(vid):
    if vid.startswith("rij"):
        return "geen geldige link"
    url = f"https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v={vid}"
    for poging in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
                json.loads(r.read())
                return None
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                return "insluiten uitgeschakeld (speelt niet af in de app)"
            if e.code in (400, 404):
                return "verwijderd of privé"
            fout = f"HTTP {e.code}"
        except Exception as e:  # netwerkhapering: even wachten en opnieuw
            fout = str(e)
        time.sleep(2 * (poging + 1))
    return f"onbekend ({fout})"


def main():
    videos = {**uit_videos_js(), **uit_sheet(os.environ.get("SHEET_CSV", ""))}
    if not videos:
        print("Geen video's gevonden.")
        return
    problemen = []
    for vid, (titel, bron) in videos.items():
        reden = check(vid)
        if reden:
            problemen.append((vid, titel, bron, reden))
        time.sleep(0.2)

    regels = [f"Gecontroleerd: **{len(videos)} video's** op {time.strftime('%d-%m-%Y')}.", ""]
    if problemen:
        regels += [f"**{len(problemen)} video('s) met een probleem:**", "",
                   "| Video | Waar | Probleem |", "| --- | --- | --- |"]
        for vid, titel, bron, reden in problemen:
            link = f"[{titel}](https://www.youtube.com/watch?v={vid})" if not vid.startswith("rij") else titel
            regels.append(f"| {link} | {bron} | {reden} |")
        regels += ["", "Wat te doen: zet de video op YouTube terug op *Niet vermeld* met insluiten aan, "
                   "of vervang de link in de Sheet (of in videos.js)."]
    else:
        regels.append("Alle video's werken. :white_check_mark:")
    rapport = "\n".join(regels)
    print(rapport)
    pathlib.Path("videocheck-rapport.md").write_text(rapport, encoding="utf-8")
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write("## Videocheck\n\n" + rapport + "\n")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"problemen={len(problemen)}\n")


if __name__ == "__main__":
    sys.exit(main())
