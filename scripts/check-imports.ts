/**
 * Static import validator.
 *
 * `checkJs` is disabled in tsconfig, so broken imports inside plain `.js`
 * modules are invisible to `tsc` and only surface as runtime SyntaxErrors.
 * This script resolves every import in the project and reports bindings that
 * the target module does not actually export.
 */

import * as path from 'path';
import * as ts from 'typescript';

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, 'tsconfig.json');

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
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

const checker = program.getTypeChecker();
const problems: string[] = [];
const skipped: string[] = [];

for (const sourceFile of program.getSourceFiles()) {
  if (sourceFile.isDeclarationFile) continue;
  if (sourceFile.fileName.includes('/node_modules/')) continue;

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!ts.isStringLiteral(specifier)) continue;

    const importPath = specifier.text;
    const isRelative = importPath.startsWith('.');
    if (!isRelative) continue; // external packages are validated at runtime

    const target = ts.resolveModuleName(
      importPath,
      sourceFile.fileName,
      parsed.options,
      ts.sys,
    ).resolvedModule;

    if (!target) {
      skipped.push(`${sourceFile.fileName}: cannot resolve '${importPath}'`);
      continue;
    }

    const clause = statement.importClause;
    if (!clause) continue;

    const targetSource = program.getSourceFile(target.resolvedFileName);
    if (!targetSource || targetSource.fileName.includes('/node_modules/')) continue;
    const targetSymbol = checker.getSymbolAtLocation(targetSource);
    if (!targetSymbol) continue;

    const exported = new Set(
      checker
        .getExportsOfModule(targetSymbol)
        .map((s) => s.getName())
        .concat(targetSource.isDeclarationFile ? [] : ['default']),
    );

    const check = (name: string) => {
      if (!exported.has(name)) {
        problems.push(
          `${path.relative(projectRoot, sourceFile.fileName)}: ` +
            `'${importPath}' has no exported member '${name}'`,
        );
      }
    };

    // `import Foo from '...'` and `import * as ns from '...'` are safe.
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        // `import { router as multiplayerRoutes }` -> validate `router`.
        check((element.propertyName ?? element.name).text);
      }
    }
  }
  void moduleSymbol;
}

if (skipped.length) {
  console.log('--- UNRESOLVED MODULES ---');
  for (const s of skipped) console.log('  ' + s);
}

if (problems.length) {
  console.log(`--- BROKEN NAMED IMPORTS (${problems.length}) ---`);
  for (const p of problems.sort()) console.log('  ' + p);
  process.exit(1);
}

console.log('All relative named imports resolve to real exports.');
