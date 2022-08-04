import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { getDefaultImageDimension, getSmallImageDimension } from "utils/utilFn";
import "./ImageShaderMaterial";
import { useRef } from "react";
import { Expo, Circ } from "gsap";
import {
  SMALL_IMAGES_PADDING,
  IMAGE_DIMENSION,
  DEFAULT_IMAGE_SCALE,
  IMAGES_ARR,
  DELAY_CONSTANT,
} from "utils/format";
const SCALE_DELAY_CONSTANT = 0.035;
const ImageBlock = ({
  url,
  index,
  imagesRef,
  imagesPosRef,
  clickedImageRef,
  modeRef,
  tlRef,
}) => {
  const { viewport } = useThree();
  const [imgTexture] = useTexture([url]);
  const numImages = IMAGES_ARR.length;
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

  const meshRef = useRef();

  const correctShaderDimensionFn = (h, targetHeight) => {
    const a = (1 - 1 / DEFAULT_IMAGE_SCALE) / (targetHeight - defaultHeight);
    const b = 1 - a * targetHeight;
    return a * h + b;
  };

  const moveCenterImage = () => {
    const tl = tlRef.current;
    tl.set(
      meshRef.current.position,
      {
        z: 0,
      },
      "start"
    )
      .to(
        meshRef.current.scale,
        {
          x: width,
          y: height,
          ease: Circ.easeOut,
          duration: 0.95,
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
      )
      .set(
        imagesPosRef.current[index],
        {
          targetX: 0,
        },
        "start"
      );
  };

  const moveSideImage = (imgMesh, imgIndex) => {
    const tl = tlRef.current;
    tl.set(
      imgMesh.position,
      {
        z: 0.001,
      },
      "start"
    )
      .to(
        imgMesh.scale,
        {
          x: smallWidth,
          y: smallHeight,
          delay: (Math.abs(imgIndex - index) - 1) * SCALE_DELAY_CONSTANT,
          ease: Circ.easeOut,
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
      )
      .to(
        imgMesh.material.uniforms.offset.value,
        {
          endArray: [0, 0],
          delay: (Math.abs(imgIndex - index) - 1) * DELAY_CONSTANT,
          ease: Circ.easeOut,
        },
        "start"
      )
      .set(
        imagesPosRef.current[imgIndex],
        {
          targetX:
            width / 2 +
            (imgIndex - 7.5) * (smallWidth + smallGap) -
            SMALL_IMAGES_PADDING,
          targetY: -height / 2 + smallHeight / 2 + SMALL_IMAGES_PADDING,
          delay: (Math.abs(imgIndex - index) - 1) * DELAY_CONSTANT,
        },
        "start"
      );
  };

  const onClickHandler = () => {
    if (modeRef.current === "list") {
      modeRef.current = "detail";
      clickedImageRef.current = index;
      tlRef.current.clear();
      imagesRef.current.children.forEach((imgMesh, imgIndex) => {
        if (imgIndex === index) {
          moveCenterImage();
        } else {
          moveSideImage(imgMesh, imgIndex);
        }
      });
    }
  };
  return (
    <mesh
      ref={meshRef}
      position={[index * (defaultWidth + defaultGap), 0, 0]}
      scale={[defaultWidth, defaultHeight, 1]}
      onClick={onClickHandler}
    >
      <planeBufferGeometry args={[1, 1, 128, 128]} />
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
