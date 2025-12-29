export type DiscreteActions = Readonly<{
  calibratePressed: boolean;
  restartPressed: boolean;
}>;

export type InputSample = Readonly<{
  /**
   * -1..+1 vertical movement (up = +1).
   * null = no input.
   */
  moveY: number | null;
  actions: DiscreteActions;
}>;

export type Disposable = Readonly<{ dispose: () => void }>;
