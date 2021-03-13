/** Found this function [there](https://gist.github.com/torifat/3ea2b8863ec38683ad2fdb22b3f2c904) and modified it a bit */
export function matchesObject(expected: any, received: any): boolean {
  if (typeof received !== typeof expected)
    return false;
  
  if (typeof expected !== "object" || expected === null)
    return expected === received;
  
  if (expected instanceof Array) {
    if (!(received instanceof Array))
      return false;
    
    if (expected.length !== received.length)
      return false;
    
    return expected.every(exp => received.some(act => matchesObject(exp, act)));
  }

  if (expected instanceof Date && received instanceof Date)
    return expected.getTime() === received.getTime();
  
  return Object.keys(expected).every(key => {
    if (!received.hasOwnProperty(key))
      return false;
    
    const exp = expected[key];
    const act = received[key];
    if (typeof exp === "object" && exp !== null && act !== null)
      return matchesObject(exp, act);
    
    return act === exp;
  });
};

// This function probably has a bad name. I don't know, you tell me.
export function getDiffFromMatch(obj: any, m: any): any {
  if (typeof obj !== "object" || obj === null
    || typeof m !== "object" || m === null)
    return obj;
  const diffFM: { [key: string]: any } = {};
  for (const prop in m) {
    if (obj[prop] === undefined) continue;
    if (typeof obj[prop] !== "object" || obj[prop] instanceof Array)
      diffFM[prop] = obj[prop];
    else
      diffFM[prop] = getDiffFromMatch(obj[prop], m[prop]);
  }
  
  return diffFM;
};

export const matchObject: Chai.ChaiPlugin = (chai, utils) => {
  const Assertion = chai.Assertion;

  Assertion.addMethod("matchObject", function(this, target) {
    const obj = this._obj;
    this.assert(
      matchesObject(target, obj),
      "Expected to match object",
      obj,
      getDiffFromMatch(target, obj)
    );
  });
};

export default matchObject;
