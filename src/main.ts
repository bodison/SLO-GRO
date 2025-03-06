import p5 from "p5";

// "dev": "bun run --hot src/index.ts",

const sketch = (p: p5) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background("red");
    p.noLoop();
  };

  p.draw = () => {
    p.strokeWeight(5);
    p.fill("blue");
    p.rect(p.width / 2, p.height / 2, 100, 100);
  };
};

new p5(sketch);
