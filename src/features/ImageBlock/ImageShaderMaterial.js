import { ShaderMaterial } from "three";
import { extend } from "@react-three/fiber";

class ImageShaderMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader: `
      #define PI 3.1415926535897932384626433832795
      varying vec2 vUv;
      varying vec2 progress;
      uniform vec2 dimension;
      uniform vec2 offset;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, 0.0, 1.0);
        progress=(uv-.5) / dimension + .5 + offset;
      }`,
      fragmentShader: `
      uniform sampler2D tex;
      varying vec2 progress;
      void main() {
        gl_FragColor = texture2D(tex, progress);
      }`,
      uniforms: {
        tex: { value: null },
        index: {
          value: 0,
        },
        dimension: {
          value: [1, 1],
        },
        offset: {
          value: [0, 0],
        },
      },
    });
  }

  set tex(value) {
    this.uniforms.tex.value = value;
  }

  get tex() {
    return this.uniforms.tex.value;
  }

  get index() {
    return this.uniforms.index.value;
  }

  set index(value) {
    this.uniforms.index.value = value;
  }

  get dimension() {
    return this.uniforms.dimension.value;
  }

  set dimension(value) {
    this.uniforms.dimension.value = value;
  }

  get offset() {
    return this.uniforms.offset.value;
  }

  set offset(val) {
    this.uniforms.offset.value[0] = val[0];
    this.uniforms.offset.value[1] = val[1];
  }
}

extend({ ImageShaderMaterial });
