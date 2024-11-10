export type ControlUpdateReason =
   | 'mounted'
   | 'selfUpdated'
   | 'parentUpdated'
   | 'unchanged'
   | 'destroyed'
   | 'forceUpdated';
