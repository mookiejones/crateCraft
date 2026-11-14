# Related tracks

<figure>
  <img alt="Related tracks on an open track, with a two-way link and suggestions." src="images/features/related-tracks.png">
  <figcaption>Example data. One saved two-way link, suggestions, and Update Serato crate.</figcaption>
</figure>

```mermaid
flowchart TD
  open["Open a track in Crates"] --> find["Find a track to link"]
  find --> save["Save link"]
  save --> file["related.sqlite, beside settings"]
  suggest["Suggestion"] --> twoway["Save stores a two-way link"]
  twoway --> file
  file --> crate["Update Serato crate"]
  crate --> quit["Quit Serato DJ Pro first"]
```

Related tracks are songs you want to remember together. The links live in `related.sqlite`, next to this app's settings, not in Serato's library. Saving or removing a link works while Serato DJ Pro is open.

1. Open a track that has a file path. A track with no path says **This track has no file path, so it cannot be linked.**
2. Find **Mixes well with**.
3. In **Find a track to link**, type a title or an artist.
4. Add a **Note** if you want one. The hint is **blend out of**. The box holds 500 characters.
5. Choose a **Link rating** from **Not rated** through **5**.
6. Leave **Two-way link** ticked, or clear it for a one-way link.
7. Click **Save link**.

The bar says **Link saved.** A two-way link reads **Two-way**. A one-way link reads **One-way**. **Remove** opens a dialog with **Remove the link to …**. Cancel or Esc leaves the link. Confirm removes it. The audio file and the Serato library do not change.

Suggestions use the same key, a neighbor on the Camelot wheel, a tempo within 6 percent, nearby Energy from the star rating, or a shared normal crate. On Crates, with a crate open, **This crate only** keeps those suggestions in that crate. It starts off. The line says **Suggested from key, tempo within 6%, energy, and shared crates. Save stores a two-way link.** That save has no note and no rating.

**Update Serato crate** writes a normal crate named `Related - ` plus the track title. Quit Serato first. While Serato is open the button stays off and the note says **Quit Serato before writing the crate.**

The live view while a deck is playing is a different app, [serato-listener](https://github.com/mookiejones/serato-listener). It reads `related.sqlite` and does not change it.

| System | File |
| --- | --- |
| Mac | `~/Library/Application Support/crateCraft/related.sqlite` |
| Windows | `%APPDATA%\crateCraft\related.sqlite` |

That folder is **crateCraft** (**Serato Library** before the rename). It is not `Serato/Library`, which holds `master.sqlite`. A move in **Organize files** updates these paths. [Where Serato data lives](Where-Serato-Data-Lives).
