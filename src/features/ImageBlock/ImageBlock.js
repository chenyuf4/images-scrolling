import { useThree } from "@react-three/fiber";
import {
  getDefaultImageDimension,
  getSmallImageDimension,
  getImageOffsetLimit,
  getDefaultScrollLimit,
} from "utils/utilFn";
import { useTexture } from "@react-three/drei";
import "./ImageShaderMaterial";
import { useRef } from "react";
import {
  DEFAULT_IMAGE_SCALE,
  IMAGE_DIMENSION,
  IMAGES_ARR,
  SMALL_IMAGES_PADDING,
  DELAY_CONSTANT,
} from "utils/format";
import { Circ } from "gsap";
import * as THREE from "three";
const geo = new THREE.PlaneBufferGeometry(1, 1);
const SCALE_DELAY_CONSTANT = 0.035;
const ImageBlock = ({
  url,
  index,
  imagesRef,
  tlRef,
  modeRef,
  scrollPosRef,
  clickedImageRef,
}) => {
  const { viewport } = useThree();
  const [imgTexture] = useTexture([url]);
  const { width, height } = viewport;
  const {
    width: defaultWidth,
    height: defaultHeight,
    gap: defaultGap,
  } = getDefaultImageDimension(width);

  const {
    width: smallWidth,
    height: smallHeight,
    gap: smallGap,
  } = getSmallImageDimension(width);

  const numImages = IMAGES_ARR.length;
  const meshRef = useRef();
  const imageOffsetLimit = getImageOffsetLimit(width);
  const scrollLimit = getDefaultScrollLimit(width);
  const defaultImageOffset = (imageOffsetLimit * index) / (numImages - 1);
  const defaultPosX = index * (defaultWidth + defaultGap);

  // (defaultHeight, 1 / 0.8)
  // (height: 1)
  // may have some potential bug, notice that default Height may need to be changed if recovering from small to big
  const correctShaderDimensionFn = (h, targetHeight) => {
    const a = (1 - 1 / DEFAULT_IMAGE_SCALE) / (targetHeight - defaultHeight);
    const b = 1 - a * targetHeight;
    return a * h + b;
  };

  const correctMainShaderOffsetFn = (x) => {
    const scrollPercentage = Math.abs(x - defaultPosX) / scrollLimit;
    return defaultImageOffset - scrollPercentage * imageOffsetLimit;
  };

  const updateMainImage = (tl) => {
    tl.to(
      meshRef.current.position,
      {
        x: 0,
        y: 0,
        z: 0,
        ease: Circ.easeOut,
        duration: 0.95,
        onUpdate: function () {
          const { x } = this.targets()[0];
          meshRef.current.material.uniforms.offset.value = [
            correctMainShaderOffsetFn(x),
            0,
          ];
        },
      },
      "start"
    ).to(
      meshRef.current.scale,
      {
        x: width,
        y: height,
        duration: 0.95,
        ease: Circ.easeOut,
        onUpdate: function () {
          const { x, y } = this.targets()[0];
          const correctScaleRatio = correctShaderDimensionFn(y, height);
          meshRef.current.material.uniforms.dimension.value = [
            (y / x) *
              (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
              correctScaleRatio,
            correctScaleRatio,
          ];
        },
      },
      "start"
    );
  };

  const updateSideImages = (tl, imgMesh, imgIndex) => {
    const defaultSmallPosX =
      width / 2 - 7.5 * (smallWidth + smallGap) - SMALL_IMAGES_PADDING;
    const defaultSmallPosY =
      -(height / 2) + SMALL_IMAGES_PADDING + smallHeight / 2;
    tl.to(
      imgMesh.position,
      {
        x: defaultSmallPosX + imgIndex * (smallWidth + smallGap),
        y: defaultSmallPosY,
        z: 0.001,
        ease: Circ.easeOut,
        delay: (Math.abs(imgIndex - index) - 1) * DELAY_CONSTANT,
      },
      "start"
    )
      .to(
        imgMesh.material.uniforms.offset.value,
        {
          endArray: [0, 0],
          ease: Circ.easeOut,
          delay: (Math.abs(imgIndex - index) - 1) * DELAY_CONSTANT,
        },
        "start"
      )
      .to(
        imgMesh.scale,
        {
          x: smallWidth,
          y: smallHeight,
          ease: Circ.easeOut,
          delay: (Math.abs(imgIndex - index) - 1) * SCALE_DELAY_CONSTANT,
          onUpdate: function () {
            const { x, y } = this.targets()[0];
            const correctScaleRatio = correctShaderDimensionFn(y, smallHeight);
            imgMesh.material.uniforms.dimension.value = [
              (y / x) *
                (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
                correctScaleRatio,
              correctScaleRatio,
            ];
          },
        },
        "start"
      );
  };
  const onClickHandler = () => {
    if (modeRef.current.some((item) => item.value === "detail")) return;
    for (let i = 0; i < modeRef.current.length; i++) {
      modeRef.current[i].value = "detail";
    }
    clickedImageRef.current = index;

    const tl = tlRef.current;
    tl.clear(); // be careful about this one
    imagesRef.current.children.forEach((imgMesh, imgIndex) => {
      if (index === imgIndex) {
        updateMainImage(tl);
      } else {
        updateSideImages(tl, imgMesh, imgIndex);
      }
    });
  };

  return (
    <mesh
      ref={meshRef}
      position={[index * (defaultWidth + defaultGap), 0, 0]}
      scale={[defaultWidth, defaultHeight, 1]}
      geometry={geo}
      onClick={onClickHandler}
    >
      <imageShaderMaterial
        tex={imgTexture}
        index={index}
        dimension={[
          (defaultHeight / defaultWidth) *
            (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
            (1 / DEFAULT_IMAGE_SCALE),
          1 / DEFAULT_IMAGE_SCALE,
        ]}
        offset={[
          ((0.5 -
            0.5 /
              ((defaultHeight / defaultWidth) *
                (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
                (1 / DEFAULT_IMAGE_SCALE))) *
            index) /
            (numImages - 1),
          0,
        ]}
      />
    </mesh>
  );
};
export default ImageBlock;

// 2200 1080

// (x - 0.5) / a + 0.5
// (x - 0.5) * (defaultWidth / defaultHeight) * (1080 / 2200)

// rectanble box, from (0,0) => (1,1)
// texture box is also (0, 0) => (1, 1), but we want to keep the ratio
// 点数为2200 * 1080， 我们暂时想展示所有的竖着的点，所以某一个点占了 1 / 1080个单位， 但是我们只想取前（2200 / 1800）横着的点。
// 所以我们有【2200 * （defaultWidth / defaultHeight, 1080]的点数

// so, we want to map (0,0) maps (0,0), (1, 1) => ((defaultWidth / defaultHeight) * () ,1)
//  y = （1080 / 2200）* 0.9 * x

// ---------(2200 / 1800, 0.9) k = 0.9 * （
// ---------
// ---------

// y = (2200 / 1800) * (defaultHeigth / defaultWidth) * (x - 0.5) + 0.5;
