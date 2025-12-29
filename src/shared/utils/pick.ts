/**
 * Create an object composed of the picked object properties
 * @param {Record<string, any>} object
 * @param {string[]} keys
 * @returns {Object}
 */

// TODO: later add correct type
/* eslint-disable @typescript-eslint/no-explicit-any */
const pick = (object: Record<string, any>, keys: string[]) =>
  keys.reduce((obj: any, key: string) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key))
      obj[key] = object[key];

    return obj;
  }, {});

export default pick;
