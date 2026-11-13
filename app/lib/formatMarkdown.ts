const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', o: 'ₒ', x: 'ₓ', n: 'ₙ',
};

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  n: 'ⁿ', i: 'ⁱ',
};

const LATEX_SYMBOLS: Array<[RegExp, string]> = [
  [/\\(?:long)?rightarrow|\\to\b/g, '→'],
  [/\\rightleftharpoons|\\leftrightarrow/g, '⇌'],
  [/\\leftarrow/g, '←'],
  [/\\times/g, '×'],
  [/\\cdot/g, '·'],
  [/\\div/g, '÷'],
  [/\\pm/g, '±'],
  [/\\approx/g, '≈'],
  [/\\neq|\\ne\b/g, '≠'],
  [/\\leq|\\le\b/g, '≤'],
  [/\\geq|\\ge\b/g, '≥'],
  [/\\infty/g, '∞'],
  [/\\Delta/g, 'Δ'],
  [/\\pi\b/g, 'π'],
  [/\\theta\b/g, 'θ'],
  [/\\alpha\b/g, 'α'],
  [/\\beta\b/g, 'β'],
  [/\\gamma\b/g, 'γ'],
  [/\\lambda\b/g, 'λ'],
  [/\\mu\b/g, 'μ'],
  [/\\Omega\b/g, 'Ω'],
  [/\\circ\b/g, '°'],
  [/\\%/g, '%'],
];

function toSubscript(str: string): string {
  return [...str].map((ch) => SUBSCRIPT_MAP[ch] ?? ch).join('');
}

function toSuperscript(str: string): string {
  return [...str].map((ch) => SUPERSCRIPT_MAP[ch] ?? ch).join('');
}

function convertLatexFragment(fragment: string): string {
  let out = fragment;

  // Remove \text{...}, \mathrm{...}, \mathbf{...}, \ce{...} mantendo o conteúdo
  for (let i = 0; i < 3; i++) {
    out = out.replace(/\\(?:text|mathrm|mathbf|mathit|ce)\{([^{}]*)\}/g, '$1');
  }

  // \frac{a}{b} -> (a)/(b) ou a/b quando simples
  out = out.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num: string, den: string) => {
    const n = num.length > 2 ? `(${num})` : num;
    const d = den.length > 2 ? `(${den})` : den;
    return `${n}/${d}`;
  });

  // \sqrt{x} -> √(x)
  out = out.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // Símbolos matemáticos e químicos
  for (const [pattern, replacement] of LATEX_SYMBOLS) {
    out = out.replace(pattern, replacement);
  }

  // Subscritos: _{...} ou _x
  out = out.replace(/_\{([^{}]+)\}/g, (_, sub: string) => toSubscript(sub));
  out = out.replace(/_([0-9+\-=()])/g, (_, sub: string) => toSubscript(sub));

  // Sobrescritos: ^{...} ou ^x
  out = out.replace(/\^\{([^{}]+)\}/g, (_, sup: string) => toSuperscript(sup));
  out = out.replace(/\^([0-9+\-=()ni])/g, (_, sup: string) => toSuperscript(sup));

  // Remove comandos de espaçamento LaTeX (\, \; \! \quad) e chaves residuais
  out = out.replace(/\\[,;!]|\\quad\b|\\qquad\b/g, ' ');
  out = out.replace(/[{}]/g, '');

  return out.trim();
}

/**
 * Converte blocos e trechos LaTeX ($$...$$, $...$, \text{...}) em texto Unicode
 * legível para renderização limpa em Markdown comum.
 */
export function cleanLatexInMarkdown(markdown: string): string {
  let result = markdown;

  // Blocos $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner: string) =>
    convertLatexFragment(inner)
  );

  // Inline $...$ (evita capturar valores monetários como R$ 10 e $ 20)
  result = result.replace(/(?<![R\\])\$([^\n$]+?)\$/g, (match, inner: string) => {
    if (/^\s*\d/.test(inner) && !/[\\_^]/.test(inner)) return match;
    return convertLatexFragment(inner);
  });

  // Caso sobre algum \text{...} fora de cifrões
  if (/\\(?:text|mathrm|ce|frac|rightarrow)\b/.test(result)) {
    result = convertLatexFragment(result);
  }

  return result;
}
