import type { Rule } from 'eslint';
export type ImportListenerCallback = (context: Rule.RuleContext, node: Rule.Node, source: string) => void;
/**
 * Creates a rule listener which listens for import/require calls and
 * calls a callback when one is found
 */
export declare function createImportListener(context: Rule.RuleContext, callback: ImportListenerCallback): Rule.RuleListener;
/**
 * Creates a rule listener for detecting dependencies in a `package.json`
 * file
 */
export declare function createPackageJsonListener(context: Rule.RuleContext, callback: ImportListenerCallback): Rule.RuleListener;
