#!/usr/bin/env python3
"""从一条配音生成一期骨架（支持 5 套口播风格与 16:9 横屏 / 3:4 竖屏主标准 / 9:16 兼容，不依赖外部商业接口）。

用法：
  python3 scripts/from_audio.py <配音 wav/m4a/mp3/mp4> <期名> \
    [--style default|blue|prism|paper|clean] \
    [--format landscape|3:4|portrait] \
    [--brand 品牌名] \
    [--title 标题] [--prompt "专有名词，用逗号分隔"]

会生成 public/episodes/<期名>/：
  narration.m4a   配音
  envelope.json   响度包络（时间轴 / 配音页里的真实波形用）
  episode.json    字幕、按句切好的镜头与零视频素材起始卡片（blue/prism/paper/clean 可直接通过 verify）

接下来：
  - default（风格 1 简约工作台）：给每个镜头把 "TODO" 换成具体模板并填 props；`at` 从 _words 查关键词时间。
  - blue / prism / paper / clean（风格 2~5 模块化口播）：生成的起始配置已对齐真实配音时长并通过校验，可直接改文字、换卡片/截图/录屏并运行 scripts/talk-sfx.py <期名>。

转写后端按顺序尝试：faster-whisper → mlx-whisper（Apple 芯片）→ openai-whisper，装了哪个用哪个。
--prompt 只在专有名词总被听错时再加：提示词里的词如果正好是配音的结尾内容，转写可能提前停（脚本会检查并自动重试）。
转写会有同音错字，生成后请通读一遍 captions 并改正专有名词。
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

def _norm_fmt(val):
    return {"3x4": "3:4", "5x8": "5:8"}.get(val, val)


ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("episode")
ap.add_argument("--style", choices=["default", "blue", "prism", "paper", "clean"], default="default",
                help="口播风格：default(简约工作台) / blue(蓝光) / prism(虹彩对话) / paper(纸感排印) / clean(纯白镜头)")
ap.add_argument("--format", type=_norm_fmt, choices=["landscape", "3:4", "portrait", "5:8"], default="landscape",
                help="画幅：landscape(1920x1080 横屏) / 3:4(1080x1440 竖屏推荐标准) / portrait(1080x1920 旧版 9:16 兼容) / 5:8(1080x1728 仅 prism/clean)")
ap.add_argument("--brand", default=None, help="品牌或频道名（1~10字），不填时用 --title 或默认“我的频道”")
ap.add_argument("--title", default=None)
ap.add_argument("--prompt", default="")
ap.add_argument("--lang", default="zh")
ap.add_argument("--max-chars", type=int, default=18)
ap.add_argument("--pause", type=float, default=0.45, help="转写没有句号时，按多长的停顿切镜头（秒）")
ap.add_argument("--captions-json", default=None, help="可选：跳过语音转写，从已有 JSON 读取 captions 或 _words")
a = ap.parse_args()
if a.format == "5:8" and a.style not in ("prism", "clean"):
    ap.error("--format 5:8 仅支持 prism / clean 风格；通用竖屏标准请使用 --format 3:4")

TABOO_RE = re.compile(r"github|gitee|抖音|小红书|douyin|bilibili|B站|https?:", re.I)
END, PUN = r"[。？！?!]$", r"[，。？！、,.?!：:；;]"


def clean_str(s, limit, fallback="内容要点"):
    txt = TABOO_RE.sub("", str(s or "")).strip()
    txt = re.sub(r"\s+", " ", txt)
    txt = re.sub(r"^[，。？！、,.?!：:；;\s]+|[，。？！、,.?!：:；;\s]+$", "", txt)
    if not txt:
        txt = fallback
    return txt[:limit]


brand = clean_str(a.brand or a.title or "我的频道", 10, "我的频道")
ep_title = clean_str(a.title or a.brand or a.episode, 24, "口播短片")

out = ROOT / "public/episodes" / a.episode
out.mkdir(parents=True, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.audio, "-vn", "-c:a", "aac", "-b:a", "192k", str(out / "narration.m4a")], check=True)
subprocess.run([sys.executable, str(ROOT / "scripts/envelope.py"), a.audio, str(out / "envelope.json")], check=True)
dur = round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.audio])), 3)


def transcribe(wav_path, prompt):
    """返回 [(字或词, start, end), ...]"""
    try:
        from faster_whisper import WhisperModel
        segs, _ = WhisperModel("small").transcribe(str(wav_path), language=a.lang, word_timestamps=True, initial_prompt=prompt or None)
        return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if w.word.strip()]
    except ImportError:
        pass
    try:
        import mlx_whisper
        r = mlx_whisper.transcribe(str(wav_path), path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language=a.lang,
                                   word_timestamps=True, initial_prompt=prompt or None)
        return [(w["word"].strip(), w["start"], w["end"]) for s in r["segments"] for w in s["words"] if w["word"].strip()]
    except ImportError:
        pass
    try:
        import whisper
        r = whisper.load_model("small").transcribe(str(wav_path), language=a.lang, word_timestamps=True, initial_prompt=prompt or None)
        return [(w["word"].strip(), w["start"], w["end"]) for s in r["segments"] for w in s["words"] if w["word"].strip()]
    except ImportError:
        sys.exit("没有找到转写后端：pip install faster-whisper（或 mlx-whisper / openai-whisper），或传入 --captions-json")


def load_words_from_json(path_str):
    raw = json.loads(Path(path_str).read_text(encoding="utf-8"))
    src_caps = raw if isinstance(raw, list) else raw.get("captions", [])
    ws = []
    for idx, c in enumerate(src_caps):
        txt = str(c.get("text", "")).strip()
        if not txt:
            continue
        st = max(0.0, float(c.get("start", 0.0)))
        en = min(dur, float(c.get("end", st + 0.5)))
        if en <= st:
            continue
        chars = list(txt)
        step = (en - st) / max(1, len(chars))
        for j, ch in enumerate(chars):
            suffix = "。" if j == len(chars) - 1 and (idx == len(src_caps) - 1 or float(src_caps[idx + 1].get("start", en)) - en >= 0.25) else ""
            ws.append((ch + suffix, st + j * step, st + (j + 1) * step))
    return ws, src_caps


preset_caps = None
if a.captions_json:
    words, preset_caps = load_words_from_json(a.captions_json)
else:
    wav = out / "_asr.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.audio, "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
    words = transcribe(wav, a.prompt)
    if a.prompt and words and dur - words[-1][2] > 2.0:
        print(f"! 转写在 {words[-1][2]:.1f}s 就停了（配音 {dur:.1f}s），去掉 --prompt 重新转写")
        words = transcribe(wav, "")
    if words and dur - words[-1][2] > 2.0:
        print(f"! 注意：转写只到 {words[-1][2]:.1f}s，配音有 {dur:.1f}s，结尾可能漏字，请手动补 captions")
    wav.unlink(missing_ok=True)


def pauses(min_len):
    """配音里的真实停顿 [(start, end), ...]"""
    o = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.audio, "-af", f"silencedetect=n=-35dB:d={min_len}", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", o)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", o)]
    return list(zip(st, en))


# 按句切镜头：有句号用句号；转写没给句号时，按配音里的停顿切（--pause 秒，默认 0.45）
sents, cur = [], []
if words and any(re.search(END, w[0]) for w in words[:-1]):
    for w in words:
        cur.append(w)
        if re.search(END, w[0]):
            sents.append(cur)
            cur = []
    if cur:
        sents.append(cur)
elif words:
    cuts = sorted((s + e) / 2 for s, e in pauses(a.pause) if 0.2 < s and e < dur - 0.2)
    k = 0
    for w in words:
        mid = (w[1] + w[2]) / 2
        while k < len(cuts) and mid > cuts[k]:
            if cur:
                sents.append(cur)
                cur = []
            k += 1
        cur.append(w)
    if cur:
        sents.append(cur)
    merged = []
    for s_ in sents:
        if merged and s_[-1][2] - s_[0][1] < 1.5:
            merged[-1] += s_
        else:
            merged.append(s_)
    sents = merged

# 字幕：按标点断行，超长再对半
caps = []


def plain(ws):
    return re.sub(PUN, "", "".join(x[0] for x in ws))


def emit(ws):
    if not ws:
        return
    if len(plain(ws)) <= a.max_chars or len(ws) < 2:
        txt = re.sub(PUN + "+$", "", "".join(x[0] for x in ws)).strip()
        if txt:
            caps.append({"text": txt, "start": round(ws[0][1], 3), "end": round(ws[-1][2], 3)})
        return
    lo, hi = max(1, len(ws) // 4), min(len(ws) - 1, max(2, len(ws) * 3 // 4))
    mid = len(ws) / 2.0

    def split_score(i):
        gap = max(0.0, ws[i][1] - ws[i - 1][2])
        prev_txt = ws[i - 1][0].strip()
        next_txt = ws[i][0].strip()
        lex = 0.0
        if prev_txt and prev_txt[-1] in "了的吗呢吧呀啊":
            lex += 0.035
        if next_txt and next_txt[0] in "但而却就再把先用让给第":
            lex += 0.035
        center_pen = -abs(i - mid) * 0.004
        return (gap >= 0.08, round(gap, 3) + lex + center_pen)

    k = max(range(lo, hi + 1), key=split_score) if lo <= hi else len(ws) // 2
    emit(ws[:k])
    emit(ws[k:])


if preset_caps is not None:
    for c in preset_caps:
        txt = clean_str(c.get("text", ""), 28, "")
        if txt:
            caps.append({"text": txt, "start": round(float(c["start"]), 3), "end": round(float(c["end"]), 3)})
else:
    for s in sents:
        has_pun = any(re.search(PUN + "$", w[0]) for w in s)
        clause = []
        for idx_w, w in enumerate(s):
            if not has_pun and clause and len(plain(clause)) >= 4 and (w[1] - clause[-1][2]) >= 0.18:
                emit(clause)
                clause = []
            clause.append(w)
            if has_pun and re.search(PUN + "$", w[0]):
                emit(clause)
                clause = []
        emit(clause)


def sanitize_captions(raw_caps, total_dur):
    """确保字幕单条 1~28 字、时间单调且不越过 total_dur。"""
    fixed = []
    cursor = 0.0
    for c in raw_caps:
        txt = clean_str(c.get("text", ""), 28, "")
        if not txt:
            continue
        st = round(max(cursor, float(c.get("start", cursor))), 3)
        en = round(min(total_dur, float(c.get("end", st + 0.5))), 3)
        if st >= total_dur - 0.05:
            break
        if en <= st:
            en = round(min(total_dur, st + 0.25), 3)
        if en > st:
            fixed.append({"text": txt, "start": st, "end": en})
            cursor = en
    if not fixed:
        fixed.append({"text": brand, "start": 0.0, "end": round(max(0.5, min(total_dur, total_dur - 0.05)), 3)})
    return fixed


def partition_spans(total_dur, sents_list, caps_list):
    """把 [0, total_dur] 切成连续镜头区间，优先贴合句界且每镜落在 [2.55, 4.85] 秒安全带内。"""
    if total_dur < 5.2:
        return [(0.0, total_dur)]
    sent_bounds = sorted({round(s[0][1], 3) for s in sents_list[1:] if 0.5 < s[0][1] < total_dur - 0.5})
    cap_bounds = sorted({round(c["start"], 3) for c in caps_list[1:] if 0.5 < c["start"] < total_dur - 0.5})
    spans = []
    t = 0.0
    while total_dur - t > 4.85:
        rem = total_dur - t
        if rem <= 9.70:
            lo = max(t + 2.55, total_dur - 4.85)
            hi = min(t + 4.85, total_dur - 2.55)
            target = t + rem / 2.0
        else:
            lo = t + 2.60
            hi = min(t + 4.75, total_dur - 5.15)
            target = min(hi, max(lo, t + 3.65))
        cands = [b for b in sent_bounds if lo <= b <= hi] or [b for b in cap_bounds if lo <= b <= hi]
        nxt = min(cands, key=lambda b: abs(b - target)) if cands else round(target, 3)
        nxt = round(min(hi, max(lo, nxt)), 3)
        spans.append((t, nxt))
        t = nxt
    spans.append((t, total_dur))
    return spans


def span_lines(caps_list, st, en, fallback):
    ov = [c["text"] for c in caps_list if c["end"] > st + 0.08 and c["start"] < en - 0.08]
    if not ov and caps_list:
        mid = (st + en) / 2.0
        nearest = min(caps_list, key=lambda c: abs((c["start"] + c["end"]) / 2.0 - mid))
        ov = [nearest["text"]]
    return ov or [fallback]


def split_pair(txt, left_max, right_max, fb_left="核心要点", fb_right="清晰呈现"):
    s = clean_str(txt, left_max + right_max, fb_left + fb_right).replace(" ", "")
    if len(s) < 2:
        return fb_left[:left_max], fb_right[:right_max]
    k = max(1, min(left_max, len(s) // 2))
    a_part = s[:k]
    b_part = s[k:k + right_max] or fb_right[:right_max]
    return a_part, b_part


def build_styled_episode(style_name, fmt, caps_list, spans):
    n = len(spans)
    first_lines = span_lines(caps_list, spans[0][0], spans[0][1], brand)
    last_lines = span_lines(caps_list, spans[-1][0], spans[-1][1], brand)

    if style_name == "blue":
        clips, shots = {}, []
        for idx, (st, en) in enumerate(spans):
            sid = f"s{idx + 1:02d}"
            lines = span_lines(caps_list, st, en, brand)
            joined = clean_str(" ".join(lines), 32, brand)
            if n == 1:
                if en - st <= 5.0:
                    p1, p2 = split_pair(joined, 10, 10, brand, "重点速览")
                    shots.append({"id": sid, "template": "blue.title", "start": st, "end": en,
                                  "props": {"kicker": brand[:10], "lines": [p1, p2]}})
                else:
                    clips["c01"] = {"kind": "card", "label": "核心画面", "title": clean_str(lines[0], 16, brand),
                                    "badge": "01", "lines": [clean_str(x, 20, brand) for x in lines[:3]]}
                    shots.append({"id": sid, "template": "blue.push", "start": st, "end": en, "props": {"media": "c01"}})
                continue
            if idx == 0:
                l1 = clean_str(lines[0], 12, brand)
                l2 = clean_str(lines[1], 12, "") if len(lines) > 1 else ""
                shots.append({"id": sid, "template": "blue.title", "start": st, "end": en,
                              "props": {"kicker": brand[:10], "lines": [l1, l2] if l2 else [l1]}})
            elif idx == n - 1:
                shots.append({"id": sid, "template": "blue.outro", "start": st, "end": en,
                              "props": {"line": clean_str(lines[0], 16, "关注更新"),
                                        "title": brand[:12],
                                        "titleAt": round(st + min(1.2, max(0.35, (en - st) * 0.42)), 3)}})
            else:
                mode = (idx - 1) % 3
                if mode == 0:
                    cid = f"c{idx:02d}"
                    p1, p2 = split_pair(lines[0], 8, 8, "核心步骤", "一目了然")
                    clips[cid] = {"kind": "card", "label": f"要点 {idx:02d}"[:10], "title": clean_str(lines[0], 16, "要点说明"),
                                  "badge": f"STEP {idx:02d}", "lines": [clean_str(x, 20, "要点展开") for x in lines[:3]]}
                    shots.append({"id": sid, "template": "blue.feature", "start": st, "end": en,
                                  "props": {"items": [{"media": cid, "lines": [p1, p2]}]}})
                elif mode == 1:
                    cid = f"c{idx:02d}"
                    clips[cid] = {"kind": "card", "label": f"展示 {idx:02d}"[:10], "title": clean_str(lines[0], 16, "画面展示"),
                                  "badge": f"PART {idx:02d}", "lines": [clean_str(x, 20, "重点细节") for x in lines[:3]]}
                    shots.append({"id": sid, "template": "blue.push", "start": st, "end": en, "props": {"media": cid}})
                else:
                    row_cards = []
                    for k in range(3):
                        rcid = f"c{idx:02d}_{k + 1}"
                        src_line = lines[k] if k < len(lines) else lines[-1]
                        clips[rcid] = {"kind": "card", "label": f"模块 {k + 1}"[:10],
                                       "title": clean_str(src_line, 16, f"模块 {k + 1}"),
                                       "badge": f"0{k + 1}", "lines": [clean_str(src_line, 20, "核心要点")]}
                        entry = {"media": rcid}
                        if k > 0:
                            entry["at"] = round(st + 0.55 * k, 3)
                        row_cards.append(entry)
                    shots.append({"id": sid, "template": "blue.row", "start": st, "end": en,
                                  "props": {"title": clean_str(lines[0], 20, "关键模块"), "cards": row_cards}})
        return {
            "id": a.episode, "title": ep_title, "style": "blue", "format": fmt,
            "duration": dur, "brand": brand, "audio": "narration.m4a",
            "music": {"src": "/blue-gallery/music.m4a", "volume": 0.28, "voiceVolume": 0.08},
            "clips": clips, "captions": caps_list, "shots": shots,
        }

    if style_name == "prism":
        shots = []
        for idx, (st, en) in enumerate(spans):
            sid = f"s{idx + 1:02d}"
            lines = span_lines(caps_list, st, en, brand)
            if n == 1:
                shots.append({"id": sid, "template": "prism.headline", "start": st, "end": en,
                              "props": {"kicker": brand, "lines": [clean_str(lines[0], 14, brand)]}})
                continue
            if idx == 0:
                shots.append({"id": sid, "template": "prism.logo", "start": st, "end": en,
                              "props": {"brand": brand, "tagline": clean_str(lines[0], 24, ep_title)}})
            elif idx == n - 1:
                p1, p2 = split_pair(lines[-1], 6, 6, "重点清晰", "即刻开拍")
                shots.append({"id": sid, "template": "prism.punch", "start": st, "end": en,
                              "props": {"kicker": brand, "lines": [[p1, p2]]}})
            else:
                mode = (idx - 1) % 4
                if mode == 0:
                    q_txt = clean_str(lines[0], 36, "这一步怎么安排更清晰？")
                    a_txt = clean_str(lines[1] if len(lines) > 1 else lines[0], 36, "按真实配音时间对齐画面重点。")
                    shots.append({"id": sid, "template": "prism.chat", "start": st, "end": en,
                                  "props": {"messages": [
                                      {"from": "user", "text": q_txt},
                                      {"from": "bench", "text": a_txt, "at": round(st + 0.85, 3), "typed": True},
                                  ]}})
                elif mode == 1:
                    shots.append({"id": sid, "template": "prism.window", "start": st, "end": en,
                                  "props": {
                                      "title": clean_str(lines[0], 22, "重点卡片预览"),
                                      "badge": f"STEP {idx:02d}",
                                      "media": {
                                          "kind": "card",
                                          "title": clean_str(lines[0], 22, "核心拆解"),
                                          "badge": f"0{idx}",
                                          "lines": [clean_str(x, 28, "要点说明") for x in lines[:3]],
                                      },
                                  }})
                elif mode == 2:
                    hl = [clean_str(x, 14, "关键结论") for x in lines[:2]]
                    shots.append({"id": sid, "template": "prism.headline", "start": st, "end": en,
                                  "props": {"kicker": f"PART {idx:02d}", "lines": hl}})
                else:
                    shots.append({"id": sid, "template": "prism.icons", "start": st, "end": en,
                                  "props": {
                                      "title": clean_str(lines[0], 16, "核心环节"),
                                      "items": [
                                          {"icon": "mic", "label": "配音驱动"},
                                          {"icon": "spark", "label": "重点提炼", "at": round(st + 0.65, 3)},
                                          {"icon": "layers", "label": "双画幅输出", "at": round(st + 1.35, 3)},
                                      ],
                                  }})
        return {
            "id": a.episode, "title": ep_title, "style": "prism", "format": fmt,
            "duration": dur, "brand": brand, "user": {"name": "观众", "initial": "观"},
            "audio": "narration.m4a",
            "music": {"src": "/prism-promo/music.m4a", "volume": 0.28, "voiceVolume": 0.08},
            "captions": caps_list, "shots": shots,
        }

    if style_name == "paper":
        shots = []
        morph_styles = ["voice", "heavy", "pixel", "breathe"]
        for idx, (st, en) in enumerate(spans):
            sid = f"s{idx + 1:02d}"
            lines = span_lines(caps_list, st, en, brand)
            if n == 1:
                p1, p2 = split_pair(lines[0], 8, 6, brand, "核心观点")
                shots.append({"id": sid, "template": "paper.line", "start": st, "end": en,
                              "props": {"line": [{"text": p1}, {"text": p2, "style": "heavy", "focus": True}]}})
                continue
            if idx == 0:
                shots.append({"id": sid, "template": "paper.intro", "start": st, "end": en,
                              "props": {"title": clean_str(lines[0], 14, brand),
                                        "sub": clean_str(lines[1] if len(lines) > 1 else ep_title, 24, ep_title),
                                        "roles": ["提出问题", "拆解结构", "落地成片"]}})
            elif idx == n - 1:
                shots.append({"id": sid, "template": "paper.outro", "start": st, "end": en,
                              "props": {"brand": brand, "line": clean_str(lines[-1], 18, "让表达更清晰"),
                                        "tagline": ep_title[:24]}})
            else:
                mode = (idx - 1) % 4
                if mode == 0:
                    raw_line = clean_str("".join(lines[:2]), 26, "把核心观点讲清楚")
                    if len(raw_line) < 4:
                        raw_line = (raw_line + "重点呈现")[:12]
                    k1 = max(1, min(10, len(raw_line) // 2))
                    k2 = min(len(raw_line), k1 + min(6, max(2, len(raw_line) - k1)))
                    seg_list = [{"text": raw_line[:k1]},
                                {"text": raw_line[k1:k2], "style": morph_styles[(idx - 1) % len(morph_styles)], "focus": True}]
                    if k2 < len(raw_line):
                        seg_list.append({"text": raw_line[k2:k2 + 12]})
                    shots.append({"id": sid, "template": "paper.line", "start": st, "end": en,
                                  "props": {"kicker": f"0{idx}", "line": seg_list}})
                elif mode == 1:
                    kw = clean_str(lines[0], 4, "核心")
                    shots.append({"id": sid, "template": "paper.wall", "start": st, "end": en,
                                  "props": {"word": kw, "roles": ["重点", "节奏", "成片"]}})
                elif mode == 2:
                    p1, p2 = split_pair(lines[0], 8, 8, "提炼结构", "放大重点")
                    shots.append({"id": sid, "template": "paper.poster", "start": st, "end": en,
                                  "props": {"kicker": f"POINT 0{idx}", "lines": [p1, p2]}})
                else:
                    r1, r2 = split_pair(lines[0], 5, 5, "清晰结构", "节奏对齐")
                    shots.append({"id": sid, "template": "paper.block", "start": st, "end": en,
                                  "props": {"label": f"STEP 0{idx}", "rows": [r1, r2]}})
        return {
            "id": a.episode, "title": ep_title, "style": "paper", "format": fmt,
            "duration": dur, "brand": brand, "tagline": ep_title[:24],
            "audio": "narration.m4a",
            "music": {"src": "/paper-line/music.m4a", "volume": 0.26, "voiceVolume": 0.08},
            "captions": caps_list, "shots": shots,
        }

    # clean
    clips, shots = {}, []
    for idx, (st, en) in enumerate(spans):
        sid = f"s{idx + 1:02d}"
        lines = span_lines(caps_list, st, en, brand)
        if n == 1:
            shots.append({"id": sid, "template": "clean.opening", "start": st, "end": en,
                          "props": {"title": brand, "kicker": clean_str(lines[0], 20, ep_title),
                                    "icons": ["sound", "text", "preview"]}})
            continue
        if idx == 0:
            shots.append({"id": sid, "template": "clean.opening", "start": st, "end": en,
                          "props": {"title": brand, "kicker": clean_str(lines[0], 20, ep_title),
                                    "icons": ["sound", "text", "preview"],
                                    "iconsAt": round(st + min(1.0, (en - st) * 0.35), 3)}})
        elif idx == n - 1:
            shots.append({"id": sid, "template": "clean.closing", "start": st, "end": en,
                          "props": {"brand": brand, "tagline": clean_str(lines[-1], 24, ep_title),
                                    "search": brand, "cta": "查看详情",
                                    "searchAt": round(st + min(1.0, (en - st) * 0.38), 3)}})
        else:
            mode = (idx - 1) % 5
            if mode == 0:
                shots.append({"id": sid, "template": "clean.drop", "start": st, "end": en,
                              "props": {"heading": "导入素材", "fileName": "narration.m4a",
                                        "result": clean_str(" ".join(lines[:2]), 36, "已对齐配音与字幕时间轴"),
                                        "dropAt": round(st + 0.75, 3),
                                        "resultAt": round(st + 1.55, 3)}})
            elif mode == 1:
                c1, c2 = f"card_{idx}_1", f"card_{idx}_2"
                kw1, kw2 = split_pair(lines[0], 8, 8, "核心要点", "画面匹配")
                clips[c1] = {"kind": "card", "label": "要点一", "title": kw1, "lines": [clean_str(lines[0], 20, kw1)]}
                clips[c2] = {"kind": "card", "label": "要点二", "title": kw2,
                             "lines": [clean_str(lines[1] if len(lines) > 1 else lines[0], 20, kw2)]}
                shots.append({"id": sid, "template": "clean.board", "start": st, "end": en,
                              "props": {"heading": "内容编排",
                                        "text": clean_str(" ".join(lines[:2]), 32, "按口播重点匹配对应卡片"),
                                        "items": [
                                            {"keyword": kw1, "label": "重点卡片", "icon": "spark", "media": c1},
                                            {"keyword": kw2, "label": "细节补充", "icon": "layers", "media": c2,
                                             "at": round(st + 1.1, 3)},
                                        ]}})
            elif mode == 2:
                cid = f"card_{idx}_p"
                clips[cid] = {"kind": "card", "label": "成片预览", "title": clean_str(lines[0], 16, brand),
                              "badge": "PREVIEW", "lines": [clean_str(x, 20, "双画幅自适应") for x in lines[:2]]}
                shots.append({"id": sid, "template": "clean.preview", "start": st, "end": en,
                              "props": {"heading": "双画幅预览", "title": clean_str(lines[0], 16, brand),
                                        "caption": clean_str(lines[-1], 22, "横屏与竖屏同步输出"),
                                        "media": cid, "mode": "both",
                                        "switchAt": round(st + min(1.5, (en - st) * 0.48), 3)}})
            elif mode == 3:
                bef = clean_str(lines[0], 24, "原始口播草稿")
                aft = clean_str(lines[1] if len(lines) > 1 else f"{bef}（精修）", 28, "结构化画面表达")
                if bef == aft:
                    aft = clean_str(f"{bef} · 已优化", 28, "已优化表达")
                shots.append({"id": sid, "template": "clean.edit", "start": st, "end": en,
                              "props": {"heading": "重点润色", "before": bef, "after": aft,
                                        "openAt": round(st + 0.65, 3), "applyAt": round(st + 1.55, 3)}})
            else:
                shots.append({"id": sid, "template": "clean.chapter", "start": st, "end": en,
                              "props": {"badge": f"PART 0{idx}", "title": clean_str(lines[0], 16, "关键章节"),
                                        "subtitle": clean_str(lines[1] if len(lines) > 1 else ep_title, 30, ep_title)}})
    return {
        "id": a.episode, "title": ep_title, "style": "clean", "format": fmt,
        "duration": dur, "brand": brand, "audio": "narration.m4a",
        "music": {"src": "/clean-ui-workflow/music.m4a", "volume": 0.28, "voiceVolume": 0.08},
        "clips": clips, "captions": caps_list, "shots": shots,
    }


if a.style == "default":
    shots = []
    if sents:
        for i, s in enumerate(sents):
            end = sents[i + 1][0][1] if i + 1 < len(sents) else dur
            shots.append({"id": f"s{i + 1:02d}", "template": "TODO", "start": round(s[0][1] if i else 0.0, 3),
                          "end": round(end, 3), "props": {"_口播": "".join(x[0] for x in s)}})
    else:
        shots.append({"id": "s01", "template": "TODO", "start": 0.0, "end": dur, "props": {"_口播": ""}})
    ep = {
        "id": a.episode, "title": a.title or a.episode, "format": a.format, "duration": dur,
        "audio": "narration.m4a", "envelope": "envelope.json",
        "voiceStart": round(words[0][1], 3) if words else 0,
        "app": {"title": brand}, "backdrop": {"kind": "grid"},
        "chapters": [{"at": 0, "label": "开场", "tab": "总览"}],
        "captions": caps, "shots": shots,
        "_words": [[w, round(s, 2)] for w, s, _ in words],
    }
    (out / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✓ {out}/episode.json：{len(shots)} 个镜头待选模板，{len(caps)} 条字幕；关键词时间见 _words")
else:
    clean_caps = sanitize_captions(caps, dur)
    spans = partition_spans(dur, sents, clean_caps)
    ep = build_styled_episode(a.style, a.format, clean_caps, spans)
    if words:
        ep["_words"] = [[w, round(s, 2)] for w, s, _ in words]
    (out / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✓ {out}/episode.json：style={a.style} ({a.format})，{len(ep['shots'])} 个起始镜头，{len(clean_caps)} 条字幕")
