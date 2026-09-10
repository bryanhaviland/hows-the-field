// Fresh-process helper spawned by fs-cp-patch.cjs — see that file for why.
const fs = require('node:fs');
const path = require('node:path');

function manualRecursiveCopy(src, dest) {
  const stat = fs.lstatSync(src);
  if (stat.isSymbolicLink()) {
    const target = fs.readlinkSync(src);
    fs.rmSync(dest, { force: true });
    fs.symlinkSync(target, dest);
    return;
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      manualRecursiveCopy(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, fs.readFileSync(src));
}

const [, , src, dest] = process.argv;
manualRecursiveCopy(src, dest);
