export const BPJS_KESEHATAN_RATE = 0.01;
export const BPJS_JHT_RATE = 0.02;
export const BPJS_JP_RATE = 0.01;

export function calculateBpjs(baseSalary: number) {
  const bpjsKesehatan = Math.round(baseSalary * BPJS_KESEHATAN_RATE);
  const bpjsJht = Math.round(baseSalary * BPJS_JHT_RATE);
  const bpjsJp = Math.round(baseSalary * BPJS_JP_RATE);
  return { bpjsKesehatan, bpjsJht, bpjsJp, total: bpjsKesehatan + bpjsJht + bpjsJp };
}