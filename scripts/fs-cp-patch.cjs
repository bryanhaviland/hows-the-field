// The device-bridge FUSE mount used for local development on this project
// starts rejecting new file opens with EACCES from *within a long-running
// Node process* once it has done enough prior I/O against the mount (a
// fresh, short-lived process against the exact same paths has no trouble).
// This preload patches fs.cpSync globally: on EACCES it shells out to a
// brand-new `node` child process to perform a plain read/write recursive
// copy, sidestepping whatever per-process state the bridge is tripping on.
// Needed for `npm run cf:deploy` (OpenNext build) to work from this
// mounted folder; harmless on any other filesystem.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const COPY_WORKER = path.join(__dirname, 'fs-cp-worker.cjs');

const origCpSync = fs.cpSync.bind(fs);
fs.cpSync = function patchedCpSync(src, dest, opts) {
  try {
    return origCpSync(src, dest, opts);
  } catch (e) {
    if (e && e.code === 'EACCES') {
      execFileSync(process.execPath, [COPY_WORKER, src, dest], { stdio: 'pipe' });
      return undefined;
    }
    throw e;
  }
};
