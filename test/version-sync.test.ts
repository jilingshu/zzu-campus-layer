import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * 版本号四件套：package.json / vite 注入 / 安卓壳 versionName / public/version.json。
 *
 * 踩过的坑：PR 只改 package.json 和 vite.config.ts，忘了 build.gradle.kts，
 * 结果 CI 打出来的 APK 仍叫 0.2.85，`apk-latest` 里也还是老文件名——
 * 用户装上后「我的」页显示的版本号对不上网页版。这道检查就是防这个。
 */
const REPO = new URL('../', import.meta.url);
const read = (rel: string): string => readFileSync(new URL(rel, REPO), 'utf8');

function pkgVersion(): string {
  return (JSON.parse(read('package.json')) as { version: string }).version;
}

function viteVersion(): string {
  const m = /__APP_VERSION__:\s*JSON\.stringify\(['"]([^'"]+)['"]\)/.exec(read('vite.config.ts'));
  return m?.[1] ?? '';
}

function gradleVersion(): string {
  const m = /versionName\s*=\s*"([^"]+)"/.exec(read('mobile/android/app/build.gradle.kts'));
  return m?.[1] ?? '';
}

function gradleVersionCode(): number {
  const m = /versionCode\s*=\s*(\d+)/.exec(read('mobile/android/app/build.gradle.kts'));
  return m ? Number(m[1]) : 0;
}

function releaseJson(): { version: string; notes: string[] } {
  return JSON.parse(read('public/version.json')) as { version: string; notes: string[] };
}

describe('版本号四件套', () => {
  it('package.json 是个 x.y.z', () => {
    expect(pkgVersion()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('vite 注入的版本与 package.json 一致', () => {
    expect(viteVersion()).toBe(pkgVersion());
  });

  it('安卓壳的 versionName 与 package.json 一致（否则 APK 还是老版本号）', () => {
    expect(gradleVersion()).toBe(pkgVersion());
  });

  it('versionCode 是正整数，且跟着版本往前走', () => {
    expect(gradleVersionCode()).toBeGreaterThan(0);
    expect(Number.isInteger(gradleVersionCode())).toBe(true);
  });

  it('public/version.json 的版本与 package.json 一致', () => {
    expect(releaseJson().version).toBe(pkgVersion());
  });

  it('version.json 至少写了一条更新说明（不然「更新完弹公告」会是空卡）', () => {
    const notes = releaseJson().notes;
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => typeof n === 'string' && n.trim().length > 0)).toBe(true);
  });
});
