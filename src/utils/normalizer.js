export const normalizeText = (input, options = {}) => {
  const { removePunctuation = false, keepSpaces = true } = options;

  if (typeof input !== "string") {
    input = "";
  }

  return (
    input
      // Normalize to NFC Unicode form
      .normalize("NFC")

      // Convert to lowercase
      .toLowerCase()

      // Remove diacritics (accents)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

      // Remove punctuation if specified
      .replace(removePunctuation ? /[^\w\s]|_/g : "", "")

      // Replace multiple spaces with single space or remove spaces
      .replace(/\s+/g, keepSpaces ? " " : "")

      // Trim whitespace
      .trim()
  );
};
