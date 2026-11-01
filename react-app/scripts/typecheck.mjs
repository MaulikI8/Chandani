import ts from 'typescript';
const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
if (!configPath) throw new Error('tsconfig.json is missing');
const file = ts.readConfigFile(configPath, ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(file.config, ts.sys, process.cwd());
const program = ts.createProgram(config.fileNames, config.options);
const diagnostics = [file.error, ...config.errors, ...ts.getPreEmitDiagnostics(program)].filter(Boolean);
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: file => file,
    getNewLine: () => '\n',
  }));
  process.exitCode = 1;
} else console.log(`TypeScript ${ts.version}: no errors`);
