#!/usr/bin/env python3
"""
Generate timed-lyric cues by FORCED-ALIGNING the album's canonical lyrics to the
generated audio. This is the high-accuracy path (used for the real cue files):

  1. Demucs isolates the vocal stem (removes the instrumentation that throws ASR
     timestamps off — especially on slow/ambient tracks).
  2. stable-ts force-aligns the *known* lyrics (from docs/album-lyrics.md) to that
     stem, so it never mis-transcribes — it just times the words you give it.

Far more accurate than transcribe-and-guess (whisper.cpp). See the Suno-API path
in scripts/suno-aligned-to-cues.ts for the alternative when you have alignedWords.

SETUP (one-time, isolated venv — these are torch-based, multi-GB):
    python3 -m venv ~/.venvs/lyricalign
    ~/.venvs/lyricalign/bin/pip install stable-ts demucs soundfile

USAGE (run with the venv's python):
    ~/.venvs/lyricalign/bin/python scripts/align-lyrics-from-audio.py 2 3 4
    ~/.venvs/lyricalign/bin/python scripts/align-lyrics-from-audio.py all --model medium

Reads  public/album/song-0N.mp3  +  docs/album-lyrics.md
Writes src/data/music/lyrics/song-0N.json
"""
import json, re, sys, subprocess, tempfile, pathlib
import stable_whisper

REPO = pathlib.Path(__file__).resolve().parent.parent
SONGS = {1:"first-breath",2:"the-reaching",3:"behind-the-veil",4:"known",
         5:"cold-light",6:"a-million-years-ahead",7:"gateway"}
# animationHints can't be inferred — re-applied here by matching line text.
HINTS = {"a-million-years-ahead": {
    "i have walked the whole long stair now": "motif-return",
    "i remember standing in the dark": "higher-self-reveal",
    "i am your higher self": "chorus-bloom",
}}
WORD = re.compile(r"[A-Za-z0-9']+")
norm = lambda s: s.lower().replace("’", "'").strip()


def canonical_lines(n: int):
    text = (REPO / "docs/album-lyrics.md").read_text(encoding="utf-8")
    for num, block in re.findall(r"## Song (\d+).*?\n```\n(.*?)\n```", text, re.DOTALL):
        if int(num) == n:
            return [ln.strip() for ln in block.split("\n")
                    if ln.strip() and not ln.strip().startswith("[")
                    and not ln.strip().startswith("(contracts")]
    raise SystemExit(f"No lyric block found for Song {n} in album-lyrics.md")


def isolate_vocal(mp3: pathlib.Path, out_dir: str) -> pathlib.Path:
    subprocess.run([sys.executable, "-m", "demucs", "--two-stems=vocals",
                    "-o", out_dir, str(mp3)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    vocals = next(pathlib.Path(out_dir).rglob("vocals.wav"), None)
    if vocals is None:
        raise SystemExit(f"Demucs produced no vocal stem for {mp3}")
    return vocals


def align(n: int, model, tmp: str):
    lines = canonical_lines(n)
    vocal = isolate_vocal(REPO / f"public/album/song-0{n}.mp3", tmp)
    try:
        result = model.align(str(vocal), "\n".join(lines), language="en", original_split=True)
    except TypeError:
        result = model.align(str(vocal), "\n".join(lines), language="en")

    segs = result.segments
    if len(segs) == len(lines):
        raw = [(float(s.start), float(s.end), lines[i]) for i, s in enumerate(segs)]
    else:  # fallback: regroup ordered words into lines by token count
        words = result.all_words(); idx = 0; raw = []
        for line in lines:
            k = len(WORD.findall(line)); chunk = words[idx:idx + k]; idx += k
            raw.append((float(chunk[0].start), float(chunk[-1].end), line) if chunk else (None, None, line))

    prev = 0.0; hints = HINTS.get(SONGS[n], {}); cues = []
    for s, e, t in raw:
        s = max(s if s is not None else prev, prev)
        e = max(e if e is not None else s + 0.5, s + 0.4)
        prev = s
        cue = {"start": round(s, 2), "end": round(e, 2), "text": t}
        h = hints.get(norm(t))
        if h:
            cue["animationHint"] = h
        cues.append(cue)

    # Spread any run of near-equal starts (a forced-alignment "collapse") evenly
    # toward the next distinct start, so stacked lines don't flash at once.
    i = 0
    while i < len(cues):
        j = i
        while j + 1 < len(cues) and cues[j + 1]["start"] - cues[i]["start"] < 0.25:
            j += 1
        if j > i:
            lo = cues[i]["start"]
            hi = cues[j + 1]["start"] if j + 1 < len(cues) else lo + 2 * (j - i + 1)
            span = hi - lo
            for k in range(i, j + 1):
                cues[k]["start"] = round(lo + span * (k - i) / (j - i + 1), 2)
                cues[k]["end"] = round(cues[k]["start"] + 0.4, 2)
        i = j + 1

    out = REPO / f"src/data/music/lyrics/song-0{n}.json"
    out.write_text(json.dumps({"songId": SONGS[n], "cues": cues}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"song-0{n} ({SONGS[n]}): {len(cues)} cues -> {out.relative_to(REPO)}")


def main():
    argv = sys.argv[1:]
    model_name = "small"
    track_args = []
    i = 0
    while i < len(argv):
        if argv[i] == "--model":
            model_name = argv[i + 1]
            i += 2
        else:
            track_args.append(argv[i])
            i += 1
    tracks = list(SONGS) if (not track_args or track_args == ["all"]) else [int(a) for a in track_args]

    model = stable_whisper.load_model(model_name)
    with tempfile.TemporaryDirectory() as tmp:
        for n in tracks:
            align(n, model, tmp)


if __name__ == "__main__":
    main()
