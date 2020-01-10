const enum Unit {
   Byte = 'B',
   KB = 'KB',
   MB = 'MB',
   GB = 'GB'
}

const STEP_SIZE = 1024;
const STEPS: Unit[] = [Unit.KB, Unit.MB, Unit.GB];
const UPPER_ROUNDING_BOUNDARY = 100;
const LOWER_ROUNDING_BOUNDARY = 10;
const ROUND = [UPPER_ROUNDING_BOUNDARY, LOWER_ROUNDING_BOUNDARY];

export default function getComputedSize(size: number): string {
   if (!size) {
      return '-----';
   }
   let _size = size;
   let _unit = Unit.Byte;
   for (const unit of STEPS) {
      if (_size < STEP_SIZE) {
         break;
      }
      _size = _size / STEP_SIZE;
      _unit = unit;
   }
   let fixedTo: number = 0;
   for (const round of ROUND) {
      if (_size >= round) {
         break;
      }
      fixedTo++;
   }
   return `${_size.toFixed(fixedTo)} ${_unit}`;
}
