import { describe, expect, it } from 'vitest';
import { displayDayShanghai, msUntilMidnightShanghai, msUntilRollover, shanghaiHour } from '../src/core/util';

/** 北京时间 21:00 是 UTC 13:00。 */
const at = (iso: string) => Date.parse(iso);

describe('shanghaiHour', () => {
  it('按 UTC+8 取小时', () => {
    expect(shanghaiHour(at('2026-11-02T12:59:00Z'))).toBe(20);
    expect(shanghaiHour(at('2026-11-02T13:00:00Z'))).toBe(21);
    expect(shanghaiHour(at('2026-11-02T16:00:00Z'))).toBe(0);
  });
});

describe('displayDayShanghai', () => {
  it('21 点前显示当天', () => {
    expect(displayDayShanghai(at('2026-11-02T12:59:00Z'))).toEqual({ date: '2026-11-02', rolled: false });
    expect(displayDayShanghai(at('2026-11-02T00:00:00Z'))).toEqual({ date: '2026-11-02', rolled: false });
  });

  it('21 点整开始翻到第二天', () => {
    expect(displayDayShanghai(at('2026-11-02T13:00:00Z'))).toEqual({ date: '2026-11-03', rolled: true });
    expect(displayDayShanghai(at('2026-11-02T15:59:00Z'))).toEqual({ date: '2026-11-03', rolled: true });
  });

  it('过了午夜又回到「当天」', () => {
    expect(displayDayShanghai(at('2026-11-02T16:00:00Z'))).toEqual({ date: '2026-11-03', rolled: false });
  });

  it('跨月也能算对', () => {
    expect(displayDayShanghai(at('2026-11-30T13:30:00Z'))).toEqual({ date: '2026-12-01', rolled: true });
  });

  it('过午夜 00:01 翻回「今天」', () => {
    expect(displayDayShanghai(at('2026-11-02T16:01:00Z'))).toEqual({ date: '2026-11-03', rolled: false });
  });

  it('翻页小时可以改', () => {
    expect(displayDayShanghai(at('2026-11-02T13:30:00Z'), 22)).toEqual({ date: '2026-11-02', rolled: false });
  });
});

describe('msUntilRollover', () => {
  it('20:00 距离 21:00 是 1 小时', () => {
    expect(msUntilRollover(at('2026-11-02T12:00:00Z'))).toBe(3_600_000);
  });

  it('21:00 整点时，下一次是明天 21:00', () => {
    expect(msUntilRollover(at('2026-11-02T13:00:00Z'))).toBe(86_400_000);
  });

  it('23:30 还剩 21.5 小时', () => {
    expect(msUntilRollover(at('2026-11-02T15:30:00Z'))).toBe(21.5 * 3_600_000);
  });
});

describe('msUntilMidnightShanghai', () => {
  it('23:30 距午夜 30 分钟', () => {
    expect(msUntilMidnightShanghai(at('2026-11-02T15:30:00Z'))).toBe(1_800_000);
  });

  it('00:00 整点时是 24 小时', () => {
    expect(msUntilMidnightShanghai(at('2026-11-02T16:00:00Z'))).toBe(86_400_000);
  });
});
