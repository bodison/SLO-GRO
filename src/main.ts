import p5 from "p5";

const sketch = (p: p5) => {
  let w: number; // pixel height and width
  let columns: number; // number of columns
  let rows: number; // number of rows
  let board: number[][]; // the grid, each position represents a pixel
  let a2i: number, b2i: number, semiAxisFrac: number; // ellipse values

  p.setup = () => {
    // Set simulation framerate to 10 to avoid flickering
    p.frameRate(10);
    p.createCanvas(700, 500);
    w = 6; // pixel height and width
    // Calculate columns and rows
    columns = p.floor(p.width / w);
    rows = p.floor(p.height / w);

    // set ellipse values
    semiAxisFrac = 1 / 2.4;
    a2i = 1.0 / p.pow(columns * semiAxisFrac, 2); // length of the semi-major axis (horizontal radius), squared, fraction
    b2i = 1.0 / p.pow(rows * semiAxisFrac, 2); // length of the semi-minor axis (vertical radius), squared, fraction

    // Wacky way to make a 2D array in JS
    board = new Array(columns);
    for (let i = 0; i < columns; i++) {
      board[i] = new Array(rows);
    }

    // initialize the board
    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        board[x][y] = 0;
      }
    }
    // set center to white
    board[p.floor(columns / 2)][p.floor(rows / 2)] = 250;
  };

  p.draw = () => {
    // draw each pixel to canvas with rect()
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        p.fill(board[i][j]);
        p.stroke(board[i][j]);
        p.rect(i * w, j * w, w - 1, w - 1);
      }
    }
  };

  p.mousePressed = () => {
    // for (let i = 240; i > 239; i--) while (!makeBranch(i));
    while (!makeBranch(220));
    while (!makeBranch(170));
    while (!makeBranch(120));
    while (!makeBranch(70));
  };

  /**
   * Returns `true` if the point (x, y) is inside the ellipse around the
   * center of the board, `false` otherwise.
   *
   * @param {number} x The x-coordinate of the point.
   * @param {number} y The y-coordinate of the point.
   * @returns {boolean} `true` if inside the ellipse, `false` otherwise.
   */
  const isInsideEllipse = (x: number, y: number) => {
    const ellipse =
      p.pow(x + 0.5 - columns / 2.0, 2) * a2i +
      p.pow(y + 0.5 - rows / 2.0, 2) * b2i;
    return ellipse <= 1.01;
  };

  /**
   * Generate a random point (x, y) on the ellipse.
   * The point is expressed in terms of the board coordinates.
   * @returns {[number, number]} a point (x, y) in board coordinates
   */
  const makeRandomPoint = () => {
    // Generate 2 random numbers in the [-1, 1] interval
    const u = Math.random() * 2 - 1;
    const v = Math.random() * 2 - 1;

    const u2 = u * u;
    const v2 = v * v;
    const r = u2 + v2;

    if (r < 1) {
      // <=
      let x = (u2 - v2) / r;
      let y = (2 * u * v) / r;

      // x and y are in [-1;1]
      let col: number = p.floor(x * columns * semiAxisFrac + columns / 2);
      let row: number = p.floor(y * rows * semiAxisFrac + rows / 2);

      // for debugging, we mark this point in a light gray
      board[col][row] = 20;

      return [col, row];
    } else {
      return makeRandomPoint();
    }
  };

  /**
   * Randomly move from (x, y) one step to an adjacent
   * square on the board.
   *
   * @param {number} x The x-coordinate of the current square.
   * @param {number} y The y-coordinate of the current square.
   * @returns {[number, number]} The new (x, y) coordinates.
   */
  const moveRandom = (x: number, y: number): [number, number] => {
    // randomizer
    const select = p.floor(Math.random() * 8);

    // go to new location
    switch (select) {
      case 0:
        return [--x, y];
      case 1:
        return [++x, y];
      case 2:
        return [x, --y];
      case 3:
        return [x, ++y];
      case 4:
        return [--x, --y];
      case 5:
        return [++x, ++y];
      case 6:
        return [++x, --y];
      case 7:
        return [--x, ++y];
    }
    return [0, 0]; // just for typescript, can never happen
  };

  /**
   * Try to create a new branch of color `val` starting at a random
   * point on the board. If the branch can't be created (because it
   * would go back into its own path), return `false`.
   *
   * @param {number} val The color of the branch.
   * @returns {boolean} `true` if the branch was created, `false` otherwise.
   */
  const makeBranch = (val: number) => {
    let [x, y] = makeRandomPoint();
    let contact = false;

    let branch = [];
    branch.push([x, y]);

    while (isInsideEllipse(x, y) && !contact) {
      // move the particle randomly, but not back into its own path
      let [xNew, yNew] = moveRandom(x, y);

      const bl = branch.length;
      // prevent going back to where branch just came from
      if (bl > 1) {
        const [xPrev, yPrev] = branch[bl - 2];
        if (xNew === xPrev && yNew === yPrev) {
          // don't go back, flip to other side
          xNew = xNew + 2 * (x - xNew);
          yNew = yNew + 2 * (y - yNew);
          // console.log("flip", xPrev, x, xNew, yPrev, y, yNew);
        } else if (xNew === xPrev && yNew === y) {
          // adjacent?
          xNew = xNew + 2 * (x - xNew);
          // console.log("flip x");
        } else if (yNew === yPrev && xNew === x) {
          // adjacent?
          yNew = yNew + 2 * (y - yNew);
          // console.log("flip y");
        }
      }
      // don't go back into current branch
      const returnedToCurrent = branch.some(
        ([x0, y0]) => x0 === xNew && y0 === yNew
      );
      if (returnedToCurrent) {
        // yes this is needed, however we end up with exactly one
        // path to center
        console.log("no going back");
        return false;
      }
      x = xNew;
      y = yNew;

      branch.push([x, y]);

      // stop if a neighbour is found
      if (
        board[x - 1][y] > 20 ||
        board[x + 1][y] > 20 ||
        board[x][y - 1] > 20 ||
        board[x][y + 1] > 20 ||
        board[x - 1][y - 1] > 20 ||
        board[x + 1][y - 1] > 20 ||
        board[x - 1][y + 1] > 20 ||
        board[x + 1][y + 1] > 20
      )
        contact = true;
    }

    if (contact) {
      console.log("contact", branch.length);
      if (branch.length > 10) {
        // don't bother with tiny paths
        // add this branch
        branch.forEach(([x, y]) => {
          board[x][y] = val;
        });
      } else {
        return false;
      }
    }
    return contact;
  };
};

new p5(sketch);
