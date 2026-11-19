#!/usr/bin/env python3
"""口播版转场与动作提示音：按镜头切点和各风格关键帧生成一条克制的音效轨，不依赖音乐节拍。

支持全部配音驱动口播风格：
  - blue:  cards / items / styles 的 at + titleAt
  - prism: items / messages(at, mediaAt) / callouts(at) / punch lines(at)
  - clean: items(at) + iconsAt / dropAt / resultAt / openAt / applyAt / switchAt / searchAt
  - paper: paper.line 重点词变形点（自动按镜头时长比例推算）+ 海报/色块/名牌轻拍点

用法：python3 scripts/talk-sfx.py <期名>
会写出 public/episodes/<期名>/sfx.m4a，并在 episode.json 里登记 "sfx"。换稿、改镜头时间后重新跑一次。
"""
import json, subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np

d = Path(__file__).resolve().parent.parent / "public/episodes" / sys.argv[1]
ep = json.loads((d / "episode.json").read_text(encoding="utf-8"))
R = 48000
dur = float(ep["duration"])
x = np.zeros(round(dur * R))
rng = np.random.default_rng(7)


def add(at, sig):
    if at is None:
        return
    i = max(0, round(float(at) * R))
    n = min(len(sig), len(x) - i)
    if n > 0:
        x[i:i + n] += sig[:n]


def whoosh():  # 镜头切换：一小段由暗到亮的气流声
    n = round(0.5 * R)
    t = np.arange(n) / R
    noise = np.cumsum(rng.standard_normal(n))
    noise -= np.linspace(noise[0], noise[-1], n)
    bright = np.diff(noise, prepend=0) * np.linspace(0.2, 1, n)
    return bright / np.abs(bright).max() * np.sin(np.pi * t / 0.5) ** 2 * 0.22


def tick(hz=880, amp=0.16):  # 说到某一项或界面动作触发：一声短促干净的提示
    n = round(0.12 * R)
    t = np.arange(n) / R
    return np.sin(2 * np.pi * hz * t) * np.minimum(1, t / 0.005) * np.exp(-t * 38) * amp


def paper_shot_cues(shot, ep_obj):
    """按 paperTalk.ts 的比例时间轴推算 paper.line 重点词变形时刻与名牌/海报轻拍点。"""
    p = shot.get("props") or {}
    st, en = float(shot["start"]), float(shot["end"])
    span = max(0.5, en - st)
    tpl = shot.get("template", "")
    out = []

    if tpl == "paper.line":
        segs = p.get("line") or []
        ep_roles = ep_obj.get("roles") or []
        p_roles = p.get("roles")
        if isinstance(p.get("swarm"), bool):
            swarm = bool(p_roles or ep_roles) if p["swarm"] else False
        else:
            swarm = isinstance(p_roles, list) and len(p_roles) > 0
        lead = min(0.18, span * 0.06)
        tail = min(1.65, max(0.75, span * 0.25)) if swarm else min(0.7, max(0.32, span * 0.15))
        avail = max(0.6, span - lead - tail)
        base_char = float(p["char"]) if isinstance(p.get("char"), (int, float)) and p["char"] > 0 else 0.11
        base_styled = float(p["styledChar"]) if isinstance(p.get("styledChar"), (int, float)) and p["styledChar"] > 0 else 0.14
        base_hold = float(p["hold"]) if isinstance(p.get("hold"), (int, float)) and p["hold"] >= 0 else 0.72
        raw_total = sum(
            len(str(seg.get("text", ""))) * (base_styled if seg.get("style") else base_char)
            + (base_hold if seg.get("style") else 0.0)
            for seg in segs
        ) or 1.0
        scale = avail / raw_total
        cur = st + lead
        hz_map = {"voice": 780, "heavy": 620, "light": 920, "breathe": 740, "pixel": 860, "lean": 820}
        styled_cues = []
        for seg in segs:
            n_chars = len(str(seg.get("text", "")))
            st_kind = seg.get("style")
            typed = cur + n_chars * (base_styled if st_kind else base_char) * scale
            end_seg = typed + (base_hold if st_kind else 0.0) * scale
            if st_kind:
                styled_cues.append((typed, hz_map.get(st_kind, 780), 0.12))
            cur = end_seg
        out.extend(styled_cues[:4])
        if swarm and cur + 0.12 < en - 0.18:
            out.append((cur + 0.12, 660, 0.11))
        return out

    if tpl in ("paper.poster", "paper.block"):
        out.append((st + min(0.45, span * 0.24), 640, 0.12))
    if isinstance(p.get("roles"), list) and len(p["roles"]) > 0 and span >= 2.0:
        out.append((st + min(0.95, span * 0.48), 840, 0.11))
    return out


for s in ep["shots"][1:]:
    add(s["start"] - 0.25, whoosh())

style = ep.get("style")
if style == "blue":
    # 保持蓝光口播版完全一致的提示音行为
    for s in ep["shots"]:
        p = s.get("props", {})
        for item in [*p.get("cards", []), *p.get("items", []), *p.get("styles", [])]:
            if isinstance(item, dict) and "at" in item:
                add(item["at"], tick())
        if "titleAt" in p:
            add(p["titleAt"], tick(660))
else:
    clean_keys = (
        ("iconsAt", 820),
        ("dropAt", 640),
        ("resultAt", 880),
        ("openAt", 760),
        ("applyAt", 660),
        ("switchAt", 720),
        ("searchAt", 840),
    )
    for s in ep["shots"]:
        p = s.get("props") or {}
        cues = []
        for item in [*p.get("cards", []), *p.get("items", []), *p.get("styles", [])]:
            if isinstance(item, dict) and isinstance(item.get("at"), (int, float)):
                cues.append((float(item["at"]), 880, 0.14))
        if isinstance(p.get("titleAt"), (int, float)):
            cues.append((float(p["titleAt"]), 660, 0.14))

        # PrismTalk: messages[].at / mediaAt, callouts[].at, punch lines[].at
        for msg in p.get("messages", []):
            if not isinstance(msg, dict):
                continue
            if isinstance(msg.get("at"), (int, float)):
                cues.append((float(msg["at"]), 860 if msg.get("from") == "user" else 740, 0.14))
            if isinstance(msg.get("mediaAt"), (int, float)):
                cues.append((float(msg["mediaAt"]), 660, 0.13))
        for cal in p.get("callouts", []):
            if isinstance(cal, dict) and isinstance(cal.get("at"), (int, float)):
                cues.append((float(cal["at"]), 920, 0.13))
        for ln in p.get("lines", []):
            if isinstance(ln, dict) and isinstance(ln.get("at"), (int, float)):
                cues.append((float(ln["at"]), 700, 0.13))

        # CleanTalk & ExpLab: 动作时间点
        for key, hz in (
            *clean_keys,
            ("strikeAt", 640),
            ("revealAt", 880),
            ("levelAt", 720),
            ("stampAt", 600),
            ("railAt", 780),
            ("countEndAt", 860),
            ("mergeAt", 700),
        ):
            if isinstance(p.get(key), (int, float)):
                cues.append((float(p[key]), hz, 0.14))

        # ExpLab: 结构分步/输入/对比条/目录/枢纽与聚光拍点
        if style == "exp-lab":
            for item in [*p.get("steps", []), *p.get("inputs", []), *p.get("bars", []), *p.get("nav", [])]:
                if isinstance(item, dict) and isinstance(item.get("at"), (int, float)):
                    cues.append((float(item["at"]), 840, 0.13))
            for sub_key, hz in (("hub", 760), ("output", 880), ("conclusion", 820)):
                sub_obj = p.get(sub_key)
                if isinstance(sub_obj, dict) and isinstance(sub_obj.get("at"), (int, float)):
                    cues.append((float(sub_obj["at"]), hz, 0.14))
            panel_obj = p.get("panel")
            if isinstance(panel_obj, dict):
                spot = panel_obj.get("spotlight")
                if isinstance(spot, dict) and isinstance(spot.get("at"), (int, float)):
                    cues.append((float(spot["at"]), 900, 0.13))

        # PaperTalk: 词形变形与版式拍点
        if style == "paper":
            cues.extend(paper_shot_cues(s, ep))

        # 单镜限流与最小间隔，避免密集提示音干扰人声
        cues.sort(key=lambda c: c[0])
        kept = []
        last_t = -9.0
        for t_at, hz, amp in cues:
            if t_at < 0.02 or t_at > dur - 0.08:
                continue
            if t_at - last_t < 0.22:
                continue
            kept.append((t_at, hz, amp))
            last_t = t_at
            if len(kept) >= 6:
                break
        for t_at, hz, amp in kept:
            add(t_at, tick(hz, amp))

with tempfile.TemporaryDirectory() as tmp:
    w = Path(tmp) / "sfx.wav"
    with wave.open(str(w), "wb") as f:
        f.setparams((1, 2, R, 0, "NONE", "not compressed"))
        f.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(w), "-c:a", "aac", "-b:a", "128k", str(d / "sfx.m4a")], check=True)

ep["sfx"] = {"src": "sfx.m4a", "volume": ep.get("sfx", {}).get("volume", 0.5)}
(d / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=1), encoding="utf-8")
print(d / "sfx.m4a")
