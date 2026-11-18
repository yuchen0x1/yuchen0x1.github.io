import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'artifacts/**', '.cache/**', '.qa/**', '.snapshot-worktree/**'] },
  js.configs.recommended, ...tseslint.configs.recommended,
  {files:['**/*.{js,mjs,ts,tsx}'], languageOptions:{globals:{process:'readonly',Buffer:'readonly',console:'readonly',fetch:'readonly',URL:'readonly',Response:'readonly',Request:'readonly',Headers:'readonly',AbortSignal:'readonly',setTimeout:'readonly',clearTimeout:'readonly'}}},
  {files:['src/**/*.{ts,tsx}'],plugins:{'react-hooks':hooks,'react-refresh':refresh},rules:{...hooks.configs.recommended.rules,'react-hooks/set-state-in-effect':'off','react-hooks/refs':'off','react-refresh/only-export-components':['warn',{allowConstantExport:true}]}}
);
