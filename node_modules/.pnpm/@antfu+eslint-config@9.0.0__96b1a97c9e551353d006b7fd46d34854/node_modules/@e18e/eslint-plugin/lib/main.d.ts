import type { ESLint } from 'eslint';
declare const configs: {
    readonly recommended: import("eslint").Linter.Config<import("@eslint/core", { with: { "resolution-mode": "require" } }).RulesConfig>;
    readonly modernization: import("eslint").Linter.Config<import("@eslint/core", { with: { "resolution-mode": "require" } }).RulesConfig>;
    readonly moduleReplacements: import("eslint").Linter.Config<import("@eslint/core", { with: { "resolution-mode": "require" } }).RulesConfig>;
    readonly performanceImprovements: import("eslint").Linter.Config<import("@eslint/core", { with: { "resolution-mode": "require" } }).RulesConfig>;
};
declare const _default: Omit<ESLint.Plugin, "configs"> & {
    configs: typeof configs;
};
export default _default;
