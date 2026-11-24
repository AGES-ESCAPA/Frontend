import { readFileSync } from 'node:fs';

const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
const total = summary.total;
console.log(
  `TOTAL lines ${total.lines.pct}% | stmts ${total.statements.pct}% | branches ${total.branches.pct}% | funcs ${total.functions.pct}%`,
);

const rows = Object.entries(summary)
  .filter(([key]) => key !== 'total')
  .map(([file, metrics]) => {
    const uncovered = metrics.lines.total - metrics.lines.covered;
    const min = Math.min(
      metrics.lines.pct,
      metrics.statements.pct,
      metrics.functions.pct,
      metrics.branches.pct,
    );
    return {
      file: file.replace(/\\/g, '/').split('/src/').pop(),
      uncovered,
      min,
      lines: metrics.lines.pct,
      branches: metrics.branches.pct,
      funcs: metrics.functions.pct,
    };
  })
  .filter((row) => row.min < 98 || row.uncovered > 0)
  .sort((a, b) => b.uncovered - a.uncovered || a.min - b.min);

console.log(`files below 98% or with uncovered lines: ${rows.length}`);
for (const row of rows.slice(0, 50)) {
  console.log(
    `${String(row.uncovered).padStart(4)} unc | L${String(row.lines).padStart(6)} B${String(row.branches).padStart(6)} F${String(row.funcs).padStart(6)} | ${row.file}`,
  );
}
