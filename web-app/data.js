const ASSET = "../assets/";

const templateCatalog = {
  cover: { label: "Main cover", artwork: "cover/Cover.png", fields: [] },
  contents: { label: "Contents", artwork: "contents/Contents.png", fields: [] },
  end: { label: "End cover", artwork: "cover/End cover.png", fields: [] },
  library: {
    label: "Library gallery", artwork: "library/Library nine covers.png",
    fields: Array.from({ length: 9 }, (_, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      return { id: `cover${i + 1}`, type: "image", x: 10.2 + col * 27.5, y: 23.1 + row * 24.8, w: 24.5, h: 20.5, placeholder: "Add cover" };
    })
  },
  series: {
    label: "Series entry", artwork: "series/Single page entry series.png",
    fields: [
      { id: "cover", type: "image", x: 10, y: 10.5, w: 37.2, h: 54.5, placeholder: "Upload series cover" },
      { id: "title", type: "text", x: 54, y: 4.8, w: 39, h: 5.5, placeholder: "Book title", align: "center", size: "large" },
      { id: "author", type: "text", x: 58, y: 11.5, w: 31, h: 3, placeholder: "Author name", align: "center" },
      { id: "rating", type: "rating", nativeArtwork: true, nativeShape: "star", x: 52.2, y: 21.8, w: 32.5, h: 4.4, max: 5 },
      { id: "seriesBooks", type: "textarea", x: 55, y: 30.5, w: 36, h: 11.5, placeholder: "Books in series..." },
      { id: "statuses", type: "checks", x: 58, y: 47.5, w: 30, h: 13.5, options: ["Hall of Fame", "Comfort Read", "Book Hangover", "Re-read", "DNF"] },
      { id: "synopsis", type: "textarea", x: 52.5, y: 68, w: 43, h: 20, placeholder: "Write a synopsis..." }
    ]
  },
  standalone: {
    label: "Standalone entry", artwork: "standalones/Single page entry standalones.png",
    fields: [
      { id: "cover", type: "image", x: 9.5, y: 9, w: 37.5, h: 59.5, placeholder: "Upload book cover" },
      { id: "title", type: "text", x: 55, y: 4.5, w: 37, h: 5.5, placeholder: "Book title", align: "center", size: "large" },
      { id: "author", type: "text", x: 59, y: 11.5, w: 29, h: 3, placeholder: "Author name", align: "center" },
      { id: "rating", type: "rating", x: 53, y: 20, w: 38, h: 4.5, max: 5 },
      { id: "spice", type: "rating", nativeArtwork: true, x: 53, y: 28.5, w: 38, h: 4.5, max: 5 },
      { id: "distinctions", type: "checks", x: 54, y: 38, w: 38, h: 4, options: ["Favourite", "Obsession"] },
      { id: "statuses", type: "checks", x: 56.5, y: 49, w: 32, h: 13.5, options: ["Hall of Fame", "Comfort Read", "Book Hangover", "Re-read", "DNF"] },
      { id: "synopsis", type: "textarea", x: 52.5, y: 69.5, w: 43, h: 18, placeholder: "Write a synopsis..." }
    ]
  },
  hallOfFameStandalone: {
    label: "Hall of Fame standalone", artwork: "hall_of_fame/Hall of Fame standalones.png",
    fields: [
      { id: "title", type: "text", x: 27, y: 20, w: 47, h: 5, placeholder: "Book title", align: "center", size: "large" },
      { id: "author", type: "text", x: 26, y: 26.1, w: 22, h: 3, placeholder: "Author" },
      { id: "date", type: "text", x: 55, y: 26.1, w: 26, h: 3, placeholder: "Date inducted" },
      { id: "cover", type: "image", x: 31, y: 31, w: 39, h: 29.5, placeholder: "Upload cover" },
      { id: "why", type: "textarea", x: 13, y: 67, w: 74, h: 14, placeholder: "Why this book is here..." },
      { id: "character", type: "textarea", x: 8, y: 87.5, w: 36, h: 7, placeholder: "Favourite character..." },
      { id: "diamond", type: "textarea", x: 56, y: 87.5, w: 37, h: 7, placeholder: "Reason it is a diamond..." }
    ]
  },
  hallOfFameSeries: {
    label: "Hall of Fame series", artwork: "hall_of_fame/Hall of Fame series.png",
    fields: [
      { id: "title", type: "text", x: 28, y: 19.5, w: 44, h: 5, placeholder: "Series title", align: "center", size: "large" },
      { id: "author", type: "text", x: 22, y: 25.2, w: 25, h: 3, placeholder: "Author" },
      { id: "date", type: "text", x: 54, y: 25.2, w: 27, h: 3, placeholder: "Date inducted" },
      { id: "cover1", type: "image", x: 7.7, y: 29.6, w: 19, h: 15.4, placeholder: "Upload cover 1" },
      { id: "cover2", type: "image", x: 29.4, y: 29.6, w: 19, h: 15.4, placeholder: "Upload cover 2" },
      { id: "cover3", type: "image", x: 51.1, y: 29.6, w: 19, h: 15.4, placeholder: "Upload cover 3" },
      { id: "cover4", type: "image", x: 72.8, y: 29.6, w: 19, h: 15.4, placeholder: "Upload cover 4" },
      { id: "cover5", type: "image", x: 7.7, y: 47.2, w: 19, h: 15.4, placeholder: "Upload cover 5" },
      { id: "cover6", type: "image", x: 29.4, y: 47.2, w: 19, h: 15.4, placeholder: "Upload cover 6" },
      { id: "cover7", type: "image", x: 51.1, y: 47.2, w: 19, h: 15.4, placeholder: "Upload cover 7" },
      { id: "cover8", type: "image", x: 72.8, y: 47.2, w: 19, h: 15.4, placeholder: "Upload cover 8" },
      { id: "why", type: "textarea", x: 14, y: 69.5, w: 72, h: 12, placeholder: "Why this series is here..." },
      { id: "character", type: "textarea", x: 8, y: 87.5, w: 37, h: 7, placeholder: "Favourite character..." },
      { id: "favouriteBook", type: "textarea", x: 55, y: 87.5, w: 37, h: 7, placeholder: "Favourite book in series..." }
    ]
  },
  bookBoyfriend: {
    label: "Book boyfriend profile", artwork: "book_boyfriends/Book Boyfriend single page entry.png",
    fields: [
      { id: "portrait", type: "image", x: 10.5, y: 12, w: 36, h: 59, placeholder: "Upload portrait" },
      { id: "name", type: "text", x: 52, y: 5, w: 42, h: 5, placeholder: "Character name", align: "center", size: "large" },
      { id: "book", type: "text", x: 53, y: 11, w: 37, h: 4, placeholder: "Book / series" },
      { id: "greenFlags", type: "checks", x: 51, y: 20, w: 22, h: 21, options: ["Protective", "Loyal", "Funny", "Intelligent", "Honest", "Supportive", "Respects Boundaries", "Communicates"] },
      { id: "redFlags", type: "checks", x: 76, y: 20, w: 21, h: 21, options: ["Possessive", "Jealous", "Murderous", "Manipulative", "Touch-Her-And-Die", "Morally Grey", "Keeps Secrets", "Violent"] },
      { id: "danger", type: "rating", icon: "♨", x: 52, y: 48, w: 21, h: 4, max: 5 },
      { id: "tropes", type: "checks", x: 76, y: 47, w: 22, h: 22, options: ["Enemies to Lovers", "Villain Gets the Girl", "Shadow Daddy", "Touch Her and Die", "Fated Mates", "Grumpy / Sunshine", "Slow Burn", "One Bed", "Forced Proximity", "Protective MMC", "Morally Grey"] },
      { id: "risk", type: "checks", x: 41, y: 78, w: 19, h: 10, options: ["No", "Probably", "Absolutely"] },
      { id: "notes", type: "textarea", x: 69, y: 78, w: 23, h: 11, placeholder: "Notes..." }
    ]
  },
  collection: { label: "Book boyfriend collection", artwork: "book_boyfriends/The Collection Page CREON.png", fields: [] },
  dnf: {
    label: "DNF autopsy report", artwork: "dnf_graveyard/Autopsy report page blank.png",
    fields: [
      { id: "case", type: "text", x: 52, y: 21, w: 18, h: 2.8, placeholder: "Case #" },
      { id: "title", type: "text", x: 27, y: 25.2, w: 23, h: 2.8, placeholder: "Book title" },
      { id: "date", type: "text", x: 67, y: 25.2, w: 18, h: 2.8, placeholder: "Date" },
      { id: "author", type: "text", x: 26, y: 28.2, w: 23, h: 2.8, placeholder: "Author" },
      { id: "percent", type: "text", x: 68, y: 28.2, w: 14, h: 2.8, placeholder: "Percent" },
      { id: "cause", type: "checks", x: 20, y: 33.5, w: 29, h: 15, options: ["Excessive Miscommunication", "Boring MMC", "Boring FMC", "Plot Found Dead in a Ditch", "Editing Crimes", "Too Many POVs", "Lost the Vibes", "Second-Act Murder of My Interest", "Everyone Needed Therapy", "Other"] },
      { id: "symptoms", type: "checks", x: 54, y: 33.5, w: 29, h: 12, options: ["Repeated Eye Rolling", "Sudden Urge to Check Phone", "Reading Became a Chore", "Confusion Without Curiosity", "Skimming Intensified", "Complete Loss of Emotional Investment", "Other"] },
      { id: "finalWords", type: "textarea", x: 20, y: 52.5, w: 31, h: 17, placeholder: "Final words..." },
      { id: "resurrection", type: "checks", x: 55, y: 52.5, w: 30, h: 10, options: ["Never", "Maybe", "On a Different Day", "Peer Pressure Might Work", "Wrong Mood, Wrong Time"] },
      { id: "notes", type: "textarea", x: 20, y: 74, w: 62, h: 12, placeholder: "Archive notes..." }
    ]
  },
  futureA: { label: "Future obsessions I", artwork: "future_obsessions/Future reads.png", fields: [] },
  futureB: { label: "Future obsessions II", artwork: "future_obsessions/Future reads page 2.png", fields: [] },
  stats: {
    label: "Archive report", artwork: "reading_stats/Stats.png",
    fields: [
      ...["Casualties", "Heat index", "Overall verdict", "Favourite hunting ground", "My usual downfall"].map((name, i) => ({ id: `stat${i}`, type: "textarea", x: 8 + i * 18.5, y: 29, w: 16.5, h: 18, placeholder: name })),
      { id: "read1", type: "textarea", x: 17, y: 56.5, w: 67, h: 5, placeholder: "1. The first revelation..." },
      { id: "read2", type: "textarea", x: 17, y: 63, w: 67, h: 5, placeholder: "2. The second revelation..." },
      { id: "read3", type: "textarea", x: 17, y: 69.2, w: 67, h: 5, placeholder: "3. The third revelation..." },
      { id: "plotTwist", type: "textarea", x: 15, y: 81.5, w: 33, h: 12, placeholder: "Plot twist..." },
      { id: "haunted", type: "textarea", x: 54, y: 81.5, w: 33, h: 12, placeholder: "Haunted by..." }
    ]
  }
};

const futureCardPositions = [
  [13, 21], [54, 21], [13, 38], [54, 38], [13, 56], [54, 56], [13, 74], [54, 74]
];
templateCatalog.futureA.fields = futureCardPositions.map(([x, y], i) => ({
  id: `future${i + 1}`, type: "textarea", x, y, w: 33, h: 10, placeholder: "Book title, author, and why it calls to you..."
}));
templateCatalog.futureB.fields = templateCatalog.futureA.fields.map(field => ({ ...field }));

templateCatalog.collection.fields = Array.from({ length: 12 }, (_, i) => {
  const col = i % 3, row = Math.floor(i / 3);
  return [
    { id: `portrait${i + 1}`, type: "image", x: 12 + col * 27, y: 18 + row * 19, w: 21, h: 14, placeholder: "Add portrait" },
    { id: `name${i + 1}`, type: "text", x: 12 + col * 27, y: 32 + row * 19, w: 21, h: 2.5, placeholder: "Character name", align: "center" }
  ];
}).flat();

function page(id, section, template, title, artwork) {
  return { id, section, template, title, artwork: artwork || templateCatalog[template].artwork, data: {}, custom: [] };
}

function repeated(section, template, count, title) {
  return Array.from({ length: count }, (_, i) => page(`${section}.${String(i + 1).padStart(3, "0")}`, section, template, `${title} ${i + 1}`));
}

function buildOriginalPages() {
  const pages = [page("cover", "front", "cover", "Main Cover"), page("contents", "front", "contents", "Contents")];
  pages.push(...Array.from({ length: 6 }, (_, i) =>
    page(`library.${String(i + 1).padStart(3, "0")}`, "library", "library", `Library Page ${i + 1}`)
  ));
  pages.push(page("series", "series", "cover", "Series Divider", "dividers/Single page entries series cover.png"), ...repeated("series", "series", 10, "Series Entry"));
  pages.push(page("standalones", "standalones", "cover", "Standalones Divider", "dividers/Single page entries standalone cover.png"), ...repeated("standalones", "standalone", 10, "Standalone Entry"));
  pages.push(page("hall_of_fame", "hall_of_fame", "cover", "Hall of Fame Divider", "dividers/Hall of Fame cover.png"), ...Array.from({ length: 20 }, (_, i) => page(`hall_of_fame.${String(i + 1).padStart(3, "0")}`, "hall_of_fame", i % 2 ? "hallOfFameStandalone" : "hallOfFameSeries", `Hall of Fame ${i + 1}`)));
  pages.push(page("book_boyfriends", "book_boyfriends", "cover", "Book Boyfriends Divider", "dividers/Book Boyfriend Cover.png"), page("book_boyfriends.001", "book_boyfriends", "collection", "The Collection"), ...repeated("book_boyfriends", "bookBoyfriend", 49, "Book Boyfriend"));
  pages.push(page("dnf_graveyard", "dnf_graveyard", "cover", "DNF Graveyard Divider", "dividers/DNF Graveyard divider.png"), ...repeated("dnf_graveyard", "dnf", 20, "Autopsy Report"));
  pages.push(page("future_obsessions", "future_obsessions", "cover", "Future Obsessions Divider", "dividers/Future reads divider.png"), ...Array.from({ length: 25 }, (_, i) => page(`future_obsessions.${String(i + 1).padStart(3, "0")}`, "future_obsessions", i % 2 ? "futureB" : "futureA", `Future Obsessions ${i + 1}`)));
  pages.push(
    page("reading_stats", "reading_stats", "cover", "Reading Stats Cover", "dividers/The keepers ledger divider.png"),
    page("reading_stats.000", "reading_stats", "stats", "Archive Report 1"),
    ...repeated("reading_stats", "stats", 5, "Archive Report"),
    page("final_entry", "end", "end", "Final Entry")
  );
  return pages;
}

const sectionLabels = {
  front: "Front Matter", library: "Library", series: "Series", standalones: "Standalones",
  hall_of_fame: "Hall of Fame", book_boyfriends: "Book Boyfriends", dnf_graveyard: "DNF Graveyard",
  future_obsessions: "Future Obsessions", reading_stats: "Reading Stats", end: "End Cover"
};
