type CalculatorInput = {
  length: number;
  width: number;
  material: "quartz";
  thickness: "12" | "20" | "30";
};

const materialRates = {
  quartz: 23500
};

const thicknessRate = {
  "12": 1,
  "20": 1.15,
  "30": 1.32
};

export function estimatePrice(input: CalculatorInput) {
  const area = (input.length / 1000) * (input.width / 1000);
  const base = area * materialRates[input.material] * thicknessRate[input.thickness];

  return Math.round(base);
}
