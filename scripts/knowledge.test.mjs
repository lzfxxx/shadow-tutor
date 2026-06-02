// Tests for knowledge.mjs — run with `npm test` (node --test).
// Uses an isolated HOME via env so it never touches the real ~/.shadow-tutor.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "knowledge.mjs");
let HOME;

function run(args, { input } = {}) {
  // Override HOME so the script reads/writes a throwaway profile.
  return execFileSync("node", [SCRIPT, ...args], {
    env: { ...process.env, HOME, USERPROFILE: HOME },
    input,
    encoding: "utf8",
  });
}
function runFail(args) {
  try { run(args); return null; }
  catch (e) { return e; } // execFileSync throws on non-zero exit
}
function profilePath() { return join(HOME, ".shadow-tutor", "knowledge.json"); }

before(() => { HOME = mkdtempSync(join(tmpdir(), "shadow-tutor-test-")); });
after(() => { rmSync(HOME, { recursive: true, force: true }); });

test("get on empty returns an empty profile", () => {
  const out = JSON.parse(run(["get"]));
  assert.equal(out.version, 1);
  assert.deepEqual(out.concepts, {});
});

test("validate accepts a well-formed concept", () => {
  const out = run(["validate", '{"concepts":{"react.use-memo":{"state":"learning","confidence":0.6}}}']);
  assert.match(out, /OK/);
});

test("validate rejects an invalid state", () => {
  const e = runFail(["validate", '{"concepts":{"x":{"state":"wizard","confidence":0.5}}}']);
  assert.ok(e, "should exit non-zero");
  assert.match(e.stderr, /invalid state/);
});

test("validate rejects out-of-range confidence", () => {
  const e = runFail(["validate", '{"concepts":{"x":{"state":"learning","confidence":9}}}']);
  assert.ok(e);
  assert.match(e.stderr, /confidence must be 0\.\.1/);
});

test("update merges and persists a concept", () => {
  run(["update", '{"concepts":{"react.use-memo":{"state":"learning","confidence":0.6,"note":"can explain"}}}']);
  const out = JSON.parse(run(["get"]));
  assert.equal(out.concepts["react.use-memo"].state, "learning");
  assert.equal(out.concepts["react.use-memo"].confidence, 0.6);
  assert.equal(out.concepts["react.use-memo"].note, "can explain");
  // update again, partial — note should be preserved, state advanced
  run(["update", '{"concepts":{"react.use-memo":{"state":"mastered","confidence":0.9}}}']);
  const out2 = JSON.parse(run(["get"]));
  assert.equal(out2.concepts["react.use-memo"].state, "mastered");
  assert.equal(out2.concepts["react.use-memo"].note, "can explain");
});

test("corrupt profile is guarded, not silently overwritten", () => {
  mkdirSync(join(HOME, ".shadow-tutor"), { recursive: true });
  writeFileSync(profilePath(), "not json");
  const e = runFail(["get"]);
  assert.ok(e);
  assert.match(e.stderr, /unparseable|invalid/i);
  // file is left intact for manual inspection
  assert.equal(readFileSync(profilePath(), "utf8"), "not json");
});

test("init refuses to clobber an existing profile without --force", () => {
  // fresh home for this case
  const prev = HOME;
  HOME = mkdtempSync(join(tmpdir(), "shadow-tutor-test2-"));
  run(["init", '{"concepts":{"js.closure":{"state":"introduced","confidence":0.3}}}']);
  assert.ok(existsSync(profilePath()));
  const e = runFail(["init", '{"concepts":{}}']);
  assert.ok(e);
  assert.match(e.stderr, /already exists/);
  // --force overwrites
  run(["init", "--force", '{"concepts":{"js.hoisting":{"state":"learning","confidence":0.5}}}']);
  const out = JSON.parse(run(["get"]));
  assert.ok(out.concepts["js.hoisting"]);
  assert.ok(!out.concepts["js.closure"]);
  rmSync(HOME, { recursive: true, force: true });
  HOME = prev;
});
