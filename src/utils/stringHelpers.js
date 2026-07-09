export const stripHtml = (html) => {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, "")
    .trim();
};

export const getGlobalProjectTitle = (patent) => {
  if (!patent) return "Untitled Project";

  // 1. Try Provisional Basic Title
  const provTitle = patent.provisional?.basic_sections?.title?.content;
  if (provTitle) return stripHtml(provTitle);

  // 2. Try Non-Provisional Basic Title
  const nonProvTitle =
    patent.nonProvisional?.basic_sections?.title_of_invention?.content;
  if (nonProvTitle) return stripHtml(nonProvTitle);

  // 3. Try Manually Entered Form Title
  const formTitle =
    patent.usptoForm?.titleOfInvention || patent.indiaForm?.title;
  if (formTitle) return stripHtml(formTitle);

  // 4. The Magic Fallback: Use the original invention text
  if (patent.inventionText) {
    const cleanText = stripHtml(patent.inventionText);
    const words = cleanText.split(/\s+/).filter(Boolean);

    if (words.length > 0) {
      const snippet = words.slice(0, 7).join(" ");
      return snippet.charAt(0).toUpperCase() + snippet.slice(1) + "...";
    }
  }

  return "Untitled Project";
};
