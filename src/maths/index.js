// index.js — which generator belongs to which skill.
//
// One map, kept in one place, so a skill in topics.js with no generator is a
// loud failure in the tests rather than a blank question in front of a child.

import * as number from './gen/number.js';
import * as calc from './gen/calc.js';
import * as tables from './gen/tables.js';
import * as fractions from './gen/fractions.js';
import * as measure from './gen/measure.js';
import * as moneytime from './gen/moneytime.js';
import * as shapedata from './gen/shapedata.js';

export const GENERATORS = {
  'count-steps': number.countSteps,
  'read-write': number.readWrite,
  partition: number.partition,
  compare: number.compare,
  order: number.order,
  'more-less': number.moreLess,

  'add-mental': calc.addMental,
  'sub-mental': calc.subMental,
  'add-column': calc.addColumn,
  'sub-column': calc.subColumn,
  'missing-number': calc.missingNumber,
  estimate: calc.estimate,
  'add-problem': calc.addProblem,

  'table-3': tables.table3,
  'table-4': tables.table4,
  'table-8': tables.table8,
  'table-mixed': tables.tableMixed,
  divide: tables.divide,
  'multiply-2digit': tables.multiply2digit,
  'times-problem': tables.timesProblem,

  'name-fraction': fractions.nameFraction,
  tenths: fractions.tenths,
  'fraction-of': fractions.fractionOf,
  equivalent: fractions.equivalent,
  'compare-fractions': fractions.compareFractions,
  'add-fractions': fractions.addFractions,

  length: measure.length,
  'mass-capacity': measure.massCapacity,
  perimeter: measure.perimeter,

  'money-total': moneytime.moneyTotal,
  'money-change': moneytime.moneyChange,

  'clock-read': moneytime.clockRead,
  roman: moneytime.roman,
  duration: moneytime.duration,

  'right-angles': shapedata.rightAngles,
  lines: shapedata.lines,
  'shape-props': shapedata.shapeProps,

  'bar-chart': shapedata.barChart,
  pictogram: shapedata.pictogram,
};
