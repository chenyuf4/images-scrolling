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
const Scene = ({ scrollPosRef }) => {
  const mounted = useRefMounted();
  const imagesRef = useRef();
  const { viewport, invalidate } = useThree();
  const { width, height } = viewport;
  const imageOffsetLimit = getImageOffsetLimit(width);
  const scrollLimit = getDefaultScrollLimit(width);
  const numImages = IMAGES_ARR.length;

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

  const tlRef = useRef(
    gsap.timeline({
      onUpdate: () => invalidate(),
      onUpdateParams: () => invalidate(),
      onStart: () => invalidate(),
    })
  );

  const modeRef = useRef("list");
  const updatePlanes = useCallback(
    (deltaTimeValue) => {
      const { current, target } = scrollPosRef.current;
      let newCurrentPos = current + (target - current) * 5 * deltaTimeValue;
      if (Math.abs(newCurrentPos - target) <= 0.001) {
        newCurrentPos = target;
      }
      const { width: defaultWidth, gap: defaultGap } =
        getDefaultImageDimension(width);
      const scrollPercentage = Math.abs(current) / scrollLimit;
      imagesRef.current.children.forEach((item, index) => {
        const defaultPosition = index * (defaultWidth + defaultGap);
        item.position.x = defaultPosition + newCurrentPos;

        const defaultImageOffset = (imageOffsetLimit * index) / (numImages - 1);
        item.material.uniforms.offset.value = [
          defaultImageOffset - scrollPercentage * imageOffsetLimit,
          0,
        ];
      });

      scrollPosRef.current.current = newCurrentPos;
      if (newCurrentPos !== target) {
        invalidate();
      }
    },
    [invalidate, scrollPosRef, width, imageOffsetLimit, numImages, scrollLimit]
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
    (imgMesh, imgIndex) => {
      const tl = tlRef.current;
      const defaultPosition = imgIndex * (defaultWidth + defaultGap);
      tl.to(
        imgMesh.scale,
        {
          x: defaultWidth,
          y: defaultHeight,
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
      ).to(
        imgMesh.position,
        {
          x: defaultPosition + scrollPosRef.current.current,
          y: 0,
          z: 0,
        },
        "start"
      );
    },
    [
      correctShaderDimensionFn,
      defaultGap,
      defaultHeight,
      defaultWidth,
      height,
      scrollPosRef,
      smallHeight,
    ]
  );

  const onWheelHandler = useCallback(
    (e) => {
      const { pixelX, pixelY } = normalizeWheel(e);

      // clear all animations and make all images return to original positions
      if (modeRef.current === "detail") {
        modeRef.current = "list";
        const tl = tlRef.current;
        tl.clear();
        imagesRef.current.children.forEach((imgMesh, imgIndex) => {
          recoverImages(imgMesh, imgIndex);
        });
      }

      const relativeSpeed = Math.min(
        100,
        Math.max(Math.abs(pixelX), Math.abs(pixelY))
      );

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
      invalidate();
    },
    [invalidate, recoverImages, scrollPosRef, width]
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
      scrollPosRef.current.current === scrollPosRef.current.target
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
          />
        ))}
      </group>
    </>
  );
};

export default Scene;
