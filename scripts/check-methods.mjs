/**
 * Find `this.foo()` calls where `foo` is not a member of the enclosing class.
 *
 * These are latent runtime TypeErrors. `tsc` cannot see them because `checkJs`
 * is disabled, so modules can import cleanly and still explode the first time a
 * code path runs. Uses the TypeScript compiler API so the results are exact.
 */

import path from 'path';
import ts from 'typescript';

const projectRoot = process.cwd();
const configFile = ts.readConfigFile(path.join(projectRoot, 'tsconfig.json'), ts.sys.readFile);
if (configFile.error) {
  console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  process.exit(1);
}
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);

const program = ts.createProgram(parsed.fileNames, {
  ...parsed.options,
  noEmit: true,
  allowJs: true,
  checkJs: false,
});

/** Collect member names declared on a class, including `this.x =` assignments. */
function collectMembers(classNode, seen = new Set()) {
  const result = { members: new Set(), externalBase: false };
  if (seen.has(classNode)) return result;
  seen.add(classNode);
  const members = result.members;

  // Inherited members: resolve `class X extends Y` when Y is in the same file.
  const heritage = classNode.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const baseType = heritage?.types?.[0];
  if (baseType && ts.isIdentifier(baseType.expression)) {
    const baseName = baseType.expression.text;
    const findClass = (node) => {
      if ((ts.isClassDeclaration(node) || ts.isClassExpression(node)) && node.name?.text === baseName) {
        return node;
      }
      return ts.forEachChild(node, findClass);
    };
    const baseNode = ts.forEachChild(classNode.getSourceFile(), findClass);
    if (baseNode) {
      const base = collectMembers(baseNode, seen);
      for (const m of base.members) members.add(m);
      result.externalBase = base.externalBase;
    } else {
      // Base declared elsewhere (e.g. `extends EventEmitter`): inherited members
      // are unknown, so this class is not reported to avoid false positives.
      result.externalBase = true;
    }
  }

  for (const member of classNode.members) {
    if (ts.isMethodDeclaration(member) || ts.isPropertyDeclaration(member) ||
        ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
      const name = member.name;
      if (name && (ts.isIdentifier(name) || ts.isStringLiteral(name))) {
        members.add(name.text);
      }
    }
  }

  // `this.foo = ...` inside the constructor (or anywhere) counts as a member.
  const visit = (node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.expression.kind === ts.SyntaxKind.ThisKeyword
    ) {
      members.add(node.left.name.text);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(classNode, visit);

  return result;
}

let total = 0;

for (const sourceFile of program.getSourceFiles()) {
  if (sourceFile.isDeclarationFile) continue;
  const fileName = sourceFile.fileName;
  if (fileName.includes('/node_modules/')) continue;

  const problems = [];

  const handleClass = (node) => {
    const { members, externalBase } = collectMembers(node);
    if (externalBase) return;

    const visit = (n) => {
      // Record the enclosing class so nested classes are checked separately.
      if ((ts.isClassDeclaration(n) || ts.isClassExpression(n)) && n !== node) {
        handleClass(n);
        return;
      }
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        n.expression.expression.kind === ts.SyntaxKind.ThisKeyword
      ) {
        const name = n.expression.name.text;
        if (!members.has(name)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile));
          problems.push(`line ${line + 1}: this.${name}() is not defined on the class`);
        }
      }
      ts.forEachChild(n, visit);
    };
    ts.forEachChild(node, visit);
  };

  const walk = (node) => {
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      handleClass(node);
      return;
    }
    ts.forEachChild(node, walk);
  };
  walk(sourceFile);

  if (problems.length) {
    console.log(`\n${path.relative(projectRoot, fileName)}`);
    for (const p of problems) console.log('   ' + p);
    total += problems.length;
  }
}

console.log(`\nTotal undefined method calls: ${total}`);
process.exit(total > 0 ? 1 : 0);
