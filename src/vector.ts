// adapted from https://github.com/evanw/lightgl.js/blob/master/src/vector.js

// Provides a simple 2D vector class.
export class Vector {
  constructor(readonly x = 0, readonly y = 0) {}

  // ### Instance Methods
  // The methods `add()`, `subtract()`, `multiply()`, and `divide()` can all
  // take either a vector or a number as an argument.
  negative(): Vector {
    return new Vector(-this.x, -this.y);
  }
  add(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x + v.x, this.y + v.y);
    } else {
      return new Vector(this.x + v, this.y + v);
    }
  }
  subtract(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x - v.x, this.y - v.y);
    } else {
      return new Vector(this.x - v, this.y - v);
    }
  }
  multiply(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x * v.x, this.y * v.y);
    } else {
      return new Vector(this.x * v, this.y * v);
    }
  }
  divide(v: Vector | number): Vector {
    if (v instanceof Vector) {
      return new Vector(this.x / v.x, this.y / v.y);
    } else {
      return new Vector(this.x / v, this.y / v);
    }
  }
  equals(v: Vector): boolean {
    return this.x == v.x && this.y == v.y;
  }
  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y;
  }
  length(): number {
    return Math.sqrt(this.dot(this));
  }
  unit(): Vector {
    return this.divide(this.length());
  }
  // min() {
  //   return Math.min(this.x, this.y);
  // }
  // max() {
  //   return Math.max(this.x, this.y);
  // }
  angleTo(a: Vector): number {
    return Math.acos(this.dot(a) / (this.length() * a.length()));
  }
  // toArray(n) {
  //   return [this.x, this.y].slice(0, n || 2);
  // }
  clone(): Vector {
    return new Vector(this.x, this.y);
  }
  reflect(about: Vector): Vector {
    const n = about.unit();
    return this.subtract(n.multiply(2).multiply(this.dot(n)));
  }
  rotate(by: number): Vector {
    const cosBy = Math.cos(by);
    const sinBy = Math.sin(by);
    return new Vector(
      cosBy * this.x - sinBy * this.y,
      sinBy * this.x + cosBy * this.y,
    );
  }

  // ### Static Methods
  // `Vector.randomDirection()` returns a vector with a length of 1 and a
  // statistically uniform direction. `Vector.lerp()` performs linear
  // interpolation between two vectors.
  // produces a unit vector at an angle
  static fromAngle(a: number): Vector {
    return new Vector(Math.cos(a), Math.sin(a));
  }
  static min(a: Vector, b: Vector) {
    return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y));
  }
  static max(a: Vector, b: Vector) {
    return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y));
  }
  static lerp(a: Vector, b: Vector, fraction: number) {
    return b.subtract(a).multiply(fraction).add(a);
  }
  static fromArray(a: [number, number]) {
    return new Vector(a[0], a[1]);
  }
}
