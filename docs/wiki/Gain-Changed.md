# Gain changed

<figure>
  <img alt="The Gain changed view listing Ada — Night Drive at -1.500 dB." src="images/features/gain-changed.png">
  <figcaption>Example data. The row is a track whose stored gain is not 0 dB.</figcaption>
</figure>

```mermaid
flowchart TD
  open["Health, then Gain changed"] --> read["Read the stored gain in Autotags"]
  read --> list["Not 0 dB: list the track"]
  read --> zero["0 dB: leave it off the list"]
  read --> unplugged["Unplugged drive: not a change"]
  list --> save["Save crate, then Confirm crate"]
  save --> crate["Gain changed, inside _crateCraft generated"]
  list --> reset["Reset to 0 dB, then Confirm reset"]
  reset --> back["Read the gain back"]
  back --> undo["Undo puts the snapshot back"]
```

**Gain changed** is under **Health**. It lists tracks whose stored gain is not 0 dB. Checking the list writes nothing.

**Save crate** shows the plan. Nothing is written until **Confirm crate**. Quit Serato first. The crate is named **Gain changed** and sits inside **_crateCraft generated**. A crate you named Gain changed somewhere else is left as it was.

**Reset to 0 dB** shows the plan. Nothing is written until **Confirm reset**. Quit Serato first. Only that stored gain changes. Auto gain, cues, the beatgrid, the overview, and the analysis stay. crateCraft reads the gain back. If it is not 0 dB, the snapshot is put back and the page says so.

**Undo reset** puts that snapshot back.

**Check again** reloads the list.
