# Won't play

**Won't play** reads the files in the crate you have selected, or the whole space when **All tracks** is on, and lists the ones a chosen CDJ or XDJ will refuse. Pick the deck, or **Common club players**. Common club players uses the stricter limit when the manuals disagree, and the page says which manual forced that limit.

The check only reads file headers. It does not convert audio, write cues, or change the library. It does not make a crate.

The note under the crate list says the check is read-only.

## Run the check

1. Open crateCraft. Serato can stay open. This check does not write.
2. Click **Gig** in the drawer, then **Won't play**.
3. Pick a player. **Common club players** is the default.
4. Click one crate, or **All tracks** for the whole space. The sheet heading names the view. **Scope** under it shows the crate, or **Whole space**.
5. Click **Check again**.

A crate change, a space change, a player change, or **Reload** repeats the check. If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

The same check from a terminal, in the repository directory:

```bash
python3 player_compat.py
```

`--player` is `club`, `cdj-3000`, `cdj-2000nxs2`, `cdj-2000nxs`, `xdj-xz`, or `xdj-1000mk2`. `--crate` is a crate id. `--scope library` checks the space. `--space` selects the space. The default space is Serato Library. The command prints the report. It does not write a file and it does not change the library.

## What the report lists

Before you click **Check again**, the page says **Not checked yet.** That is not a failure.

| What you see | What it means |
| --- | --- |
| **Won't play** | The header is outside the format table in the cited manual. A hatched triangle sits with the words. |
| **Check first** | The manuals do not call this a refusal, and this scan cannot call it playable. A VBR MP3 with no Xing, Info, or VBRI header is one of these. |
| **Will play** | The header sits inside the cited table. The manuals also say some files in a supported format still will not play. This scan does not play the file on a deck. |
| **Unknown** | The file is missing, the drive is unplugged, or the header could not be read. It is not marked as playable. |
| **Show** | Filters the list. **Won't play and check first** is the default. |

The reason names the header: a WAVE_FORMAT_EXTENSIBLE WAV, 32-bit float, a sample rate the manual does not list, ALAC or HE-AAC read from the `.m4a`, a copy-protected `.m4p`, a name that does not match the audio, or AIFF-C. **What to do** says how to make a copy the player can take. It does not change your file.

The USB line names the file systems in the cited manual. exFAT is named as not supported only when a cited manual says so. That line does not check the stick. Stick format stays on **Check drive**.

## Where the limits come from

The tables are the makers' manuals, not a third-party chart.

| Player | Manual |
| --- | --- |
| CDJ-2000NXS | Operating Instructions DRI1052. No FLAC or ALAC. WAV and AIFF stop at 48 kHz. |
| CDJ-2000NXS2 | Operating Instructions DRI1290A. FLAC and ALAC, including 88.2 and 96 kHz. |
| CDJ-3000 | Instruction manual supported-file table, and the Pioneer DJ news specifications of 10 September 2020. MP3 and AAC are 44.1 and 48 kHz. Lossless includes 96 kHz. |
| XDJ-XZ | Operating Instructions DRI1625B. MPEG-1 MP3, FLAC to 48 kHz, no ALAC. exFAT is not supported. E-8305 is the unsupported-file screen. |
| XDJ-1000MK2 | Operating Instructions, playable music file formats. FLAC and ALAC to 48 kHz. |
| Common club players | The stricter row of those five. The page names the manual that dropped the looser row. |

A 128 kbps MP3 is inside every cited MPEG-1 row. None of these manuals set a 192 kbps floor, so that file is not a refusal.
