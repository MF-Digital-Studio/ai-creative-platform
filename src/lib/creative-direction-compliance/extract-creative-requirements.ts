import type { CreativeRequirement, CreativeRequirementCategory, CreativeRequirementImportance, CreativeRequirementStatus } from "./types";

type Matcher = { category: CreativeRequirementCategory; importance: CreativeRequirementImportance; pattern: RegExp; value: string };

const matchers: readonly Matcher[] = [
  { category: "styling", importance: "required", pattern: /\bblack\s+sleeve\b|\bsiyah\s+kol\b/i, value: "black sleeve styling" },
  { category: "subject_appearance", importance: "required", pattern: /\b(?:black|siyah)\s+(?:nails?|ojeli|oje)\b|\b(?:siyah|kırmızı|kirmizi|red)\s+ojeli\b/i, value: "black nail polish" },
  { category: "subject_appearance", importance: "required", pattern: /\b(?:red|kırmızı|kirmizi)\s+nails?\b|\b(?:kırmızı|kirmizi)\s+ojeli\b/i, value: "red nail polish" },
  { category: "interaction", importance: "required", pattern: /\b(?:woman'?s|feminine|kadın|kadin)\s+hand\b|\b(?:kadın|kadin)\s+el(?:i|inde)?\b/i, value: "an elegant feminine hand" },
  { category: "lighting", importance: "required", pattern: /\bwarm\s+(?:directional\s+)?light(?:ing)?\b|\bsıcak\s+ışık\b|\bsicak\s+isik\b/i, value: "warm directional light" },
  { category: "lighting", importance: "preferred", pattern: /\bsoft\s+light(?:ing)?\b|\byumuşak\s+ışık\b|\byumusak\s+isik\b/i, value: "soft light" },
  { category: "surface", importance: "required", pattern: /\bmarble\s+surface\b|\bmermer\s+(?:yüzey|zemin)\b/i, value: "marble surface" },
  { category: "surface", importance: "required", pattern: /\bwood(?:en)?\s+surface\b|\bahşap\s+(?:yüzey|zemin)\b|\bahsap\s+(?:yuzey|zemin)\b/i, value: "wood surface" },
  { category: "surface", importance: "preferred", pattern: /\bmetal\s+surface\b|\bglass\s+surface\b|\bmetal\s+yüzey\b|\bcam\s+yüzey\b/i, value: "metal or glass surface" },
  { category: "composition", importance: "required", pattern: /\bclose[- ]?up\b|\byakın\s+plan\b|\byakin\s+plan\b/i, value: "close-up presentation" },
  { category: "composition", importance: "required", pattern: /\bmacro\b|\bmakro\b/i, value: "macro presentation" },
  { category: "composition", importance: "required", pattern: /\b(?:wide|full[- ]body)\s+(?:shot|fashion\s+shoot)?\b|\bgeniş\s+(?:moda\s+)?çekimi\b|\bgenis\s+(?:moda\s+)?cekimi\b/i, value: "wide full-body framing" },
  { category: "environment", importance: "required", pattern: /\b(?:red|kırmızı|kirmizi)\s+background\b|\b(?:kırmızı|kirmizi)\s+arka\s+plan\b/i, value: "deep red background" },
  { category: "environment", importance: "preferred", pattern: /\bdark\s+(?:street\s+)?background\b|\bkoyu\s+(?:sokak\s+)?arka\s+plan\b/i, value: "dark background" },
  { category: "environment", importance: "preferred", pattern: /\bwhite\s+studio\s+background\b|\bbeyaz\s+stüdyo\s+arka\s+planı\b|\bbeyaz\s+studyo\s+arka\s+plani\b/i, value: "white studio background" },
  { category: "mood", importance: "decorative", pattern: /\belegant\b|\bzarif\b/i, value: "elegant mood" },
  { category: "mood", importance: "preferred", pattern: /\bpremium\b|\blüks\b|\bluks\b/i, value: "premium mood" },
  { category: "mood", importance: "decorative", pattern: /\bdramatic\b|\bdramatik\b/i, value: "dramatic mood" },
  { category: "mood", importance: "decorative", pattern: /\bminimal\b|\bminimalist\b/i, value: "minimal mood" },
];

const targetedColorPattern = /\b(?:gold|golden|altın|altin|silver|gümüş|gumus|black|siyah|red|kırmızı|kirmizi|blue|mavi|green|yeşil|yesil|white|beyaz)\s+(?:ring|yüzük|yuzuk|dial|kadran|shoe|shoes|ayakkabı|ayakkabi|bottle|şişe|sise|dress|garment|elbise|kıyafet|kiyafet)\b|\b(?:make|turn|recolor|yap|dönüştür|donustur)\b.{0,24}\b(?:ring|yüzük|yuzuk|dial|kadran|shoe|shoes|ayakkabı|ayakkabi|bottle|şişe|sise|dress|garment|elbise|kıyafet|kiyafet)\b/i;

function colorValue(prompt: string): string | null {
  const colors: readonly [RegExp, string][] = [
    [/\b(?:gold|golden|altın|altin)\b/i, "gold"], [/\b(?:silver|gümüş|gumus)\b/i, "silver"],
    [/\b(?:black|siyah)\b/i, "black"], [/\b(?:red|kırmızı|kirmizi)\b/i, "red"],
    [/\b(?:blue|mavi)\b/i, "blue"], [/\b(?:green|yeşil|yesil)\b/i, "green"], [/\b(?:white|beyaz)\b/i, "white"],
  ];
  return colors.find(([pattern]) => pattern.test(prompt))?.[1] ?? null;
}

export function extractCreativeRequirements(userPrompt: string): CreativeRequirement[] {
  const requirements = matchers.filter(({ pattern }) => pattern.test(userPrompt)).map(({ category, importance, value }) => ({ category, importance, value, status: (importance === "decorative" ? "decorative" : "applied") as CreativeRequirementStatus, source: "explicit_user" as const }));
  if (targetedColorPattern.test(userPrompt)) {
    const value = colorValue(userPrompt);
    const target = userPrompt.match(/\b(?:ring|yüzük|yuzuk|dial|kadran|shoe|shoes|ayakkabı|ayakkabi|bottle|şişe|sise|dress|garment|elbise|kıyafet|kiyafet)\b/i)?.[0];
    if (value) requirements.push({ category: "color", value: target ? `${value} ${target}` : value, importance: "required", status: "applied", source: "explicit_user" });
  }
  return requirements.filter((requirement, index, all) => all.findIndex((candidate) => candidate.category === requirement.category && candidate.value === requirement.value) === index);
}
