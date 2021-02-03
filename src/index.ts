export const sum = (a: number, b: number) => {
  console.log("yeet²");
  return a + b;
};

export function* foo() {
  let bool: boolean = true;
  if (Math.random() < 0.5)
    bool = yield 100;
  return `Finished! (${bool})`;
}