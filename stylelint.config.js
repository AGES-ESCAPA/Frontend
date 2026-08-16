/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // ── Regra Principal ───────────────────────────────────────────────────────
    // Proíbe cores hexadecimais brutas nas propriedades de cor.
    // O time deve usar SEMPRE as variáveis CSS de src/index.css.
    //
    //   ✅  color: var(--color-accent);
    //   ❌  color: #c9a84c;   ← bloqueado no commit e na CI
    //
    'declaration-property-value-disallowed-list': {
      color: ['/#[0-9a-fA-F]{3,8}/'],
      'background-color': ['/#[0-9a-fA-F]{3,8}/'],
      'border-color': ['/#[0-9a-fA-F]{3,8}/'],
      'outline-color': ['/#[0-9a-fA-F]{3,8}/'],
      fill: ['/#[0-9a-fA-F]{3,8}/'],
      stroke: ['/#[0-9a-fA-F]{3,8}/'],
    },

    // Permite nomes de fontes com letras maiúsculas (ex: "SFMono-Regular", "Georgia")
    'value-keyword-case': null,

    // Permite o padrão --text-xl--line-height (duplo hífen nos tokens de tipografia)
    'custom-property-pattern': null,

    // Permite rgba() no formato legado (usado nos tokens do design system)
    'color-function-notation': null,
    'alpha-value-notation': null,

    // Permite -webkit- para compatibilidade cross-browser
    'property-no-vendor-prefix': null,

    // Permite comentários sem espaço antes de */
    'comment-whitespace-inside': null,

    // Compatibilidade com CSS Modules (classes geradas como .card, .hero etc.)
    'selector-class-pattern': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,

    // Evita declarações duplicadas no mesmo bloco
    'declaration-block-no-duplicate-properties': true,
  },
  ignoreFiles: ['node_modules/**', 'dist/**', 'coverage/**'],
};
