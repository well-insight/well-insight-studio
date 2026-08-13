const statefulFlags = /[gy]/;
function isStaticNewRegExp(node) {
    if (node.callee.type !== 'Identifier' ||
        node.callee.name !== 'RegExp' ||
        node.arguments.length === 0 ||
        node.arguments.length > 2) {
        return false;
    }
    if (!node.arguments.every((arg) => arg.type === 'Literal' && typeof arg.value === 'string')) {
        return false;
    }
    const flagsArg = node.arguments[1];
    if (flagsArg && statefulFlags.test(flagsArg.value)) {
        return false;
    }
    return true;
}
export const preferStaticRegex = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer defining regular expressions at module scope to avoid re-compilation on every function call',
            recommended: true
        },
        schema: [],
        messages: {
            preferStatic: 'Move this regular expression to module scope to avoid re-compilation on every call.'
        }
    },
    create(context) {
        return {
            ':function Literal[regex]'(node) {
                const { flags } = node.regex;
                if (statefulFlags.test(flags)) {
                    return;
                }
                context.report({ node, messageId: 'preferStatic' });
            },
            ':function NewExpression'(node) {
                if (isStaticNewRegExp(node)) {
                    context.report({ node, messageId: 'preferStatic' });
                }
            }
        };
    }
};
