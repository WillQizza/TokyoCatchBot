export function findMedianWithoutOutliers(input: number[]) {
  input.sort();

  // Find quartiles
  const q1 = input[Math.floor(input.length / 4)];
  const q3 = input[Math.ceil(input.length * (3/4))];

  const iqr = q3 - q1;

  // Give a little wiggle room
  const minValue = q1 - iqr * 2;
  const maxValue = q3 + iqr * 2;

  const validInput = input.filter(v => v >= minValue && v <= maxValue);

  return validInput[Math.floor(validInput.length / 2)];
}