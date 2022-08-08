import ImageBlock from "features/ImageBlock/ImageBlock";
import { IMAGES_ARR, IMAGE_DIMENSION, DEFAULT_IMAGE_SCALE } from "utils/format";
import useRefMounted from "hooks/useRefMounted";
import { useRef, useCallback, useEffect } from "react";
import {
  getDefaultImageDimension,
  getDefaultScrollLimit,
  getImageOffsetLimit,
  getSmallImageDimension,
} from "utils/utilFn";
import normalizeWheel from "normalize-wheel";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Power4 } from "gsap";
import * as THREE from "three";
const { lerp } = THREE.MathUtils;
const Scene = ({ scrollPosRef }) => {
  const mounted = useRefMounted();
  const imagesRef = useRef();
  const { viewport } = useThree();
  const { width, height } = viewport;
  const imageOffsetLimit = getImageOffsetLimit(width);
  const scrollLimit = getDefaultScrollLimit(width);
  const numImages = IMAGES_ARR.length;
  const clickedImageRef = useRef(-1);

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

  const tlRef = useRef(gsap.timeline());

  const modeRef = useRef(
    Array.from({ length: numImages }).map((_) => ({
      value: "list",
    }))
  );
  const updatePlanes = useCallback(
    (deltaTimeValue) => {
      const { target } = scrollPosRef.current;
      const { width: defaultWidth, gap: defaultGap } =
        getDefaultImageDimension(width);
      imagesRef.current.children.forEach((item, index) => {
        if (modeRef.current[index].value === "detail") return;
        const defaultPosition = index * (defaultWidth + defaultGap);
        const scrollPercentage =
          Math.abs(item.position.x - defaultPosition) / scrollLimit;
        let newPosX =
          item.position.x +
          (defaultPosition + target - item.position.x) * 6 * deltaTimeValue;

        if (Math.abs(defaultPosition + target - newPosX) <= 0.001) {
          newPosX = defaultPosition + target;
        }
        item.position.x = newPosX;

        const defaultImageOffset = (imageOffsetLimit * index) / (numImages - 1);
        item.material.uniforms.offset.value = [
          defaultImageOffset - scrollPercentage * imageOffsetLimit,
          0,
        ];
      });

      // scrollPosRef.current.current = newCurrentPos;
    },
    [scrollPosRef, width, scrollLimit, imageOffsetLimit, numImages]
  );

  // (smallHeight/larget, 1) => (defaultHeight, 0.8)
  const correctShaderDimensionFn = useCallback(
    (h, targetHeight) => {
      const a = (1 - 1 / DEFAULT_IMAGE_SCALE) / (targetHeight - defaultHeight);
      const b = 1 - a * targetHeight;
      return a * h + b;
    },
    [defaultHeight]
  );

  const recoverImages = useCallback(
    (imgMesh, imgIndex, activeImage, delayIndex) => {
      const tl = tlRef.current;
      const delayValue = (activeImage === imgIndex ? 0 : delayIndex) * 0.04;
      tl.set(
        modeRef.current[imgIndex],
        { value: "list", delay: delayValue },
        "start"
      )
        .to(
          imgMesh.scale,
          {
            x: defaultWidth,
            y: defaultHeight,
            delay: delayValue,
            duration: imgIndex === activeImage ? 1.1 : 0.6,
            ease: Power4.easeOut,
            onUpdate: function () {
              const { x, y } = this.targets()[0];
              const correctScaleRatio = correctShaderDimensionFn(
                y,
                y > defaultHeight ? height : smallHeight
              );
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
          imgMesh.position,
          {
            y: 0,
            duration: imgIndex === activeImage ? 1.1 : 0.6,
            delay: delayValue,
            ease: Power4.easeOut,
          },
          "start"
        );
    },
    [correctShaderDimensionFn, defaultHeight, defaultWidth, height, smallHeight]
  );

  const onWheelHandler = useCallback(
    (e) => {
      const { pixelX, pixelY } = normalizeWheel(e);

      // clear all animations and make all images return to original positions
      if (modeRef.current.every((item) => item.value === "detail")) {
        const tl = tlRef.current;
        tl.clear();
        const activeImage = clickedImageRef.current;
        let delayIndex = 0;
        imagesRef.current.children.forEach((imgMesh, imgIndex) => {
          recoverImages(imgMesh, imgIndex, activeImage, delayIndex);
          if (imgIndex !== activeImage) delayIndex += 1;
        });
        clickedImageRef.current = -1;
      }

      const relativeSpeed = Math.max(Math.abs(pixelX), Math.abs(pixelY));

      const scrollSpeed = relativeSpeed * 0.01;

      let direction = "L";
      let horizonal = true;
      if (Math.abs(pixelY) > Math.abs(pixelX)) {
        horizonal = false;
      }
      if (horizonal) {
        if (pixelX < 0) {
          direction = "R";
        } else {
          direction = "L";
        }
      } else {
        if (pixelY < 0) {
          direction = "R";
        } else {
          direction = "L";
        }
      }

      // update target position
      let target =
        scrollPosRef.current.target +
        (direction === "L" ? -scrollSpeed : scrollSpeed);
      const scrollLimit = getDefaultScrollLimit(width);
      target = Math.max(-scrollLimit, Math.min(0, target));
      scrollPosRef.current.target = target;
    },
    [recoverImages, scrollPosRef, width]
  );

  useEffect(() => {
    window.addEventListener("wheel", onWheelHandler);
    return () => {
      window.removeEventListener("wheel", onWheelHandler);
    };
  }, [onWheelHandler]);

  useFrame((_, delta) => {
    if (
      !mounted.current ||
      modeRef.current.every((item) => item.value === "detail")
    )
      return;

    updatePlanes(delta);
  });

  return (
    <>
      <group ref={imagesRef}>
        {IMAGES_ARR.map((url, index) => (
          <ImageBlock
            url={url}
            key={index}
            index={index}
            imagesRef={imagesRef}
            tlRef={tlRef}
            modeRef={modeRef}
            scrollPosRef={scrollPosRef}
            clickedImageRef={clickedImageRef}
          />
        ))}
      </group>
    </>
  );
};

export default Scene;
