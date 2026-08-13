import type { TSNode, TSToken, TSESTree, ParserServicesWithTypeInformation } from '@typescript-eslint/typescript-estree';
import type { TSESLint } from '@typescript-eslint/utils';
import type ts from 'typescript';
export interface ParserServices {
    emitDecoratorMetadata: boolean | undefined;
    experimentalDecorators: boolean | undefined;
    isolatedDeclarations: boolean | undefined;
    esTreeNodeToTSNodeMap: WeakMap<TSESTree.Node, TSNode | TSToken>;
    tsNodeToESTreeNodeMap: WeakMap<TSNode | TSToken, TSESTree.Node>;
    getSymbolAtLocation: (node: TSESTree.Node) => ts.Symbol | undefined;
    getTypeAtLocation: (node: TSESTree.Node) => ts.Type;
    program: ts.Program;
}
export declare function tryGetTypedParserServices(context: Readonly<TSESLint.RuleContext<string, unknown[]>>): ParserServicesWithTypeInformation | null;
export declare function getTypedParserServices(context: Readonly<TSESLint.RuleContext<string, unknown[]>>): ParserServicesWithTypeInformation;
/**
 * Checks if a node's type is an Array type (Array, tuple, or typed array)
 * Returns undefined if types are unavailable, letting callers choose their
 * own default behaviour
 */
export declare function isArrayType(node: TSESTree.Node, context: Readonly<TSESLint.RuleContext<string, unknown[]>>): boolean | undefined;
/**
 * Checks if a node's type is a Set
 * Returns undefined if types are unavailable, letting callers choose their
 * own default behaviour
 */
export declare function isSetType(node: TSESTree.Node, context: Readonly<TSESLint.RuleContext<string, unknown[]>>): boolean | undefined;
/**
 * Checks if a node's type is a string
 * Returns undefined if types are unavailable, letting callers choose their
 * own default behaviour
 */
export declare function isStringType(node: TSESTree.Node, context: Readonly<TSESLint.RuleContext<string, unknown[]>>): boolean | undefined;
