import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * eslint-config-next 16 ships flat configs directly, so they are spread in as-is.
 * An earlier version of this file wrapped them in FlatCompat, which threw on a
 * circular reference while serialising the config.
 */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default config;
