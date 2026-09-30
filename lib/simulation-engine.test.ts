import assert from 'node:assert/strict';
import test from 'node:test';
import { assets } from './mock-data.ts';
import { calculateSimulation } from './simulation-engine.ts';

const asset = assets[1];
const run = (scenario: 'rise' | 'fall' | 'flat', changeRate: number, initialAmount = 1_000_000) =>
  calculateSimulation({ asset, scenario, changeRate, initialAmount }, '2026-09-30T00:00:00.000Z');

test('상승 10%는 평가금액과 양수 손익을 계산한다', () => { const result = run('rise', 10); assert.equal(result.estimatedValue, 1_100_000); assert.equal(result.profitLoss, 100_000); assert.equal(result.returnRate, 10); });
test('하락 10%는 평가금액과 음수 손익을 계산한다', () => { const result = run('fall', 10); assert.equal(result.estimatedValue, 900_000); assert.equal(result.profitLoss, -100_000); assert.equal(result.returnRate, -10); });
test('보합은 원금과 0%를 유지한다', () => { const result = run('flat', 30); assert.equal(result.estimatedValue, 1_000_000); assert.equal(result.profitLoss, 0); assert.equal(result.returnRate, 0); });
test('0원 투자는 거부한다', () => assert.throws(() => run('rise', 10, 0), /0보다/));
test('잘못된 변동률은 거부한다', () => assert.throws(() => run('rise', 101), /0에서 100/));
