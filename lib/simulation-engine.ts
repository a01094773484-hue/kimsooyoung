import type { Asset } from './mock-data';

export type SimulationScenario = 'rise' | 'fall' | 'flat';

export type SimulationInput = {
  asset: Asset;
  initialAmount: number;
  changeRate: number;
  scenario: SimulationScenario;
  hypothesis?: string;
};

export type SimulationResult = {
  asset: Asset;
  initialAmount: number;
  basePrice: number;
  changeRate: number;
  scenario: SimulationScenario;
  estimatedValue: number;
  profitLoss: number;
  returnRate: number;
  hypothesis?: string;
  calculatedAt: string;
};

export function parseAssetPrice(price: string) {
  const parsed = Number(price.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('자산의 기준 가격을 확인할 수 없어요.');
  return parsed;
}

export function calculateSimulation(input: SimulationInput, calculatedAt = new Date().toISOString()): SimulationResult {
  if (!Number.isFinite(input.initialAmount) || input.initialAmount <= 0) throw new Error('투자금액은 0보다 커야 합니다.');
  if (!Number.isFinite(input.changeRate) || input.changeRate < 0 || input.changeRate > 100) throw new Error('변동률은 0에서 100 사이여야 합니다.');
  const basePrice = parseAssetPrice(input.asset.price);
  const signedRate = input.scenario === 'rise' ? input.changeRate : input.scenario === 'fall' ? -input.changeRate : 0;
  const estimatedValue = Math.round(input.initialAmount * (1 + signedRate / 100));
  const profitLoss = estimatedValue - input.initialAmount;
  return { ...input, basePrice, changeRate: Math.abs(signedRate), estimatedValue, profitLoss, returnRate: signedRate, calculatedAt };
}
