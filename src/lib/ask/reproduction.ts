/**
 * Verbatim-reproduction detection for the Ask feature.
 *
 * The model is given short source excerpts as private grounding and is strongly
 * instructed never to reproduce them. This is a cheap, non-blocking safety net:
 * after a response finishes we check whether any excerpt appears verbatim in the
 * output so we can log/flag it for monitoring. It converts the no-reproduction
 * policy into a mechanism — it does not censor the (already streamed) response.
 */

/** Lowercase and collapse whitespace so trivial formatting differences don't hide a match. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Return the first excerpt that appears verbatim (after whitespace/case
 * normalization) inside `output`, or `null` if none do. Only excerpts of at
 * least `minChars` are considered, so incidental short phrases (a term, a name)
 * don't trip the flag.
 */
export function findReproducedExcerpt(
  output: string,
  excerpts: string[],
  minChars: number = 40
): string | null {
  const haystack = normalize(output);
  if (!haystack) return null;

  for (const excerpt of excerpts) {
    const needle = normalize(excerpt);
    if (needle.length >= minChars && haystack.includes(needle)) {
      return excerpt;
    }
  }
  return null;
}
