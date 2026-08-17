export type MaritalStatus = "LAJANG" | "KAWIN";
export type PtkpCategory = "A" | "B" | "C";

type TerBracket = { maxGross: number; rate: number };

const TER_A: TerBracket[] = [
  { maxGross: 5_400_000, rate: 0 },
  { maxGross: 5_650_000, rate: 0.0025 },
  { maxGross: 5_950_000, rate: 0.005 },
  { maxGross: 6_300_000, rate: 0.0075 },
  { maxGross: 6_750_000, rate: 0.01 },
  { maxGross: 7_500_000, rate: 0.0125 },
  { maxGross: 8_550_000, rate: 0.015 },
  { maxGross: 9_650_000, rate: 0.0175 },
  { maxGross: 10_050_000, rate: 0.02 },
  { maxGross: 10_350_000, rate: 0.0225 },
  { maxGross: 10_700_000, rate: 0.025 },
  { maxGross: 11_050_000, rate: 0.03 },
  { maxGross: 11_600_000, rate: 0.035 },
  { maxGross: 12_500_000, rate: 0.04 },
  { maxGross: 13_750_000, rate: 0.05 },
  { maxGross: 15_100_000, rate: 0.06 },
  { maxGross: 16_950_000, rate: 0.07 },
  { maxGross: 19_750_000, rate: 0.08 },
  { maxGross: 24_150_000, rate: 0.09 },
  { maxGross: 26_450_000, rate: 0.1 },
  { maxGross: 28_000_000, rate: 0.11 },
  { maxGross: 30_050_000, rate: 0.12 },
  { maxGross: 32_400_000, rate: 0.13 },
  { maxGross: 35_400_000, rate: 0.14 },
  { maxGross: 39_100_000, rate: 0.15 },
  { maxGross: 43_850_000, rate: 0.16 },
  { maxGross: 47_800_000, rate: 0.17 },
  { maxGross: 51_400_000, rate: 0.18 },
  { maxGross: 56_300_000, rate: 0.19 },
  { maxGross: 62_200_000, rate: 0.2 },
  { maxGross: 68_600_000, rate: 0.21 },
  { maxGross: 77_500_000, rate: 0.22 },
  { maxGross: 89_000_000, rate: 0.23 },
  { maxGross: 103_000_000, rate: 0.24 },
  { maxGross: 125_000_000, rate: 0.25 },
  { maxGross: 157_000_000, rate: 0.26 },
  { maxGross: 206_000_000, rate: 0.27 },
  { maxGross: 337_000_000, rate: 0.28 },
  { maxGross: 454_000_000, rate: 0.29 },
  { maxGross: 550_000_000, rate: 0.3 },
  { maxGross: 695_000_000, rate: 0.31 },
  { maxGross: 910_000_000, rate: 0.32 },
  { maxGross: 1_400_000_000, rate: 0.33 },
  { maxGross: Infinity, rate: 0.34 },
];

const TER_B: TerBracket[] = [
  { maxGross: 6_200_000, rate: 0 },
  { maxGross: 6_500_000, rate: 0.0025 },
  { maxGross: 6_850_000, rate: 0.005 },
  { maxGross: 7_300_000, rate: 0.0075 },
  { maxGross: 9_200_000, rate: 0.01 },
  { maxGross: 10_750_000, rate: 0.015 },
  { maxGross: 11_250_000, rate: 0.02 },
  { maxGross: 11_600_000, rate: 0.025 },
  { maxGross: 12_600_000, rate: 0.03 },
  { maxGross: 13_600_000, rate: 0.04 },
  { maxGross: 14_950_000, rate: 0.05 },
  { maxGross: 16_400_000, rate: 0.06 },
  { maxGross: 18_450_000, rate: 0.07 },
  { maxGross: 21_850_000, rate: 0.08 },
  { maxGross: 26_000_000, rate: 0.09 },
  { maxGross: 27_700_000, rate: 0.1 },
  { maxGross: 29_350_000, rate: 0.11 },
  { maxGross: 31_450_000, rate: 0.12 },
  { maxGross: 33_950_000, rate: 0.13 },
  { maxGross: 37_100_000, rate: 0.14 },
  { maxGross: 41_100_000, rate: 0.15 },
  { maxGross: 45_800_000, rate: 0.16 },
  { maxGross: 49_500_000, rate: 0.17 },
  { maxGross: 53_800_000, rate: 0.18 },
  { maxGross: 58_500_000, rate: 0.19 },
  { maxGross: 64_000_000, rate: 0.2 },
  { maxGross: 71_000_000, rate: 0.21 },
  { maxGross: 80_000_000, rate: 0.22 },
  { maxGross: 93_000_000, rate: 0.23 },
  { maxGross: 109_000_000, rate: 0.24 },
  { maxGross: 129_000_000, rate: 0.25 },
  { maxGross: 163_000_000, rate: 0.26 },
  { maxGross: 211_000_000, rate: 0.27 },
  { maxGross: 374_000_000, rate: 0.28 },
  { maxGross: 459_000_000, rate: 0.29 },
  { maxGross: 555_000_000, rate: 0.3 },
  { maxGross: 704_000_000, rate: 0.31 },
  { maxGross: 957_000_000, rate: 0.32 },
  { maxGross: 1_405_000_000, rate: 0.33 },
  { maxGross: Infinity, rate: 0.34 },
];

const TER_C: TerBracket[] = [
  { maxGross: 6_600_000, rate: 0 },
  { maxGross: 6_950_000, rate: 0.0025 },
  { maxGross: 7_350_000, rate: 0.005 },
  { maxGross: 7_800_000, rate: 0.0075 },
  { maxGross: 8_850_000, rate: 0.01 },
  { maxGross: 9_800_000, rate: 0.0125 },
  { maxGross: 10_950_000, rate: 0.015 },
  { maxGross: 11_200_000, rate: 0.0175 },
  { maxGross: 12_050_000, rate: 0.02 },
  { maxGross: 12_950_000, rate: 0.03 },
  { maxGross: 14_150_000, rate: 0.04 },
  { maxGross: 15_550_000, rate: 0.05 },
  { maxGross: 17_050_000, rate: 0.06 },
  { maxGross: 19_500_000, rate: 0.07 },
  { maxGross: 22_700_000, rate: 0.08 },
  { maxGross: 26_600_000, rate: 0.09 },
  { maxGross: 28_100_000, rate: 0.1 },
  { maxGross: 30_100_000, rate: 0.11 },
  { maxGross: 32_600_000, rate: 0.12 },
  { maxGross: 35_400_000, rate: 0.13 },
  { maxGross: 38_900_000, rate: 0.14 },
  { maxGross: 43_000_000, rate: 0.15 },
  { maxGross: 47_400_000, rate: 0.16 },
  { maxGross: 51_200_000, rate: 0.17 },
  { maxGross: 55_800_000, rate: 0.18 },
  { maxGross: 60_400_000, rate: 0.19 },
  { maxGross: 66_700_000, rate: 0.2 },
  { maxGross: 74_500_000, rate: 0.21 },
  { maxGross: 83_200_000, rate: 0.22 },
  { maxGross: 95_600_000, rate: 0.23 },
  { maxGross: 110_000_000, rate: 0.24 },
  { maxGross: 134_000_000, rate: 0.25 },
  { maxGross: 169_000_000, rate: 0.26 },
  { maxGross: 221_000_000, rate: 0.27 },
  { maxGross: 390_000_000, rate: 0.28 },
  { maxGross: 463_000_000, rate: 0.29 },
  { maxGross: 561_000_000, rate: 0.3 },
  { maxGross: 709_000_000, rate: 0.31 },
  { maxGross: 965_000_000, rate: 0.32 },
  { maxGross: 1_419_000_000, rate: 0.33 },
  { maxGross: Infinity, rate: 0.34 },
];

const TER_BY_CATEGORY: Record<PtkpCategory, TerBracket[]> = {
  A: TER_A,
  B: TER_B,
  C: TER_C,
};

export function getPtkpCategory(
  maritalStatus: MaritalStatus,
  dependents: number
): PtkpCategory {
  const d = Math.min(Math.max(0, dependents), 3);
  if (d === 0) return "A";
  if (d === 1) return maritalStatus === "KAWIN" ? "B" : "A";
  if (d === 2) return "B";
  return maritalStatus === "KAWIN" ? "C" : "B";
}

export function terRate(category: PtkpCategory, gross: number): number {
  const table = TER_BY_CATEGORY[category];
  for (const bracket of table) {
    if (gross <= bracket.maxGross) return bracket.rate;
  }
  return 0.34;
}

export function calculatePph21(
  maritalStatus: MaritalStatus,
  dependents: number,
  gross: number
): number {
  const category = getPtkpCategory(maritalStatus, dependents);
  const rate = terRate(category, gross);
  return Math.round(gross * rate);
}
