/**
 * Rendu d'un texte simple saisi par l'admin :
 *  - ligne commençant par "## " → sous-titre
 *  - lignes commençant par "- " → liste à puces
 *  - ligne vide → nouveau paragraphe
 */
export function SimpleText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-4 text-gray-700">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-inside list-disc space-y-1">
              {lines.map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        if (lines.length === 1 && lines[0].startsWith("## ")) {
          return (
            <h2 key={i} className="pt-2 text-lg font-bold text-gray-900">
              {lines[0].slice(3)}
            </h2>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {l}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
