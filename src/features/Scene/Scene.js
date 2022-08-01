import ImageBlock from "features/ImageBlock/ImageBlock";
import { IMAGES_ARR } from "utils/format";
import useRefMounted from "hooks/useRefMounted";
import { useRef, useCallback, useEffect } from "react";
import {
  getDefaultImageDimension,
  getDefaultScrollLimit,
  getImageOffsetLimit,
} from "utils/utilFn";
import normalizeWheel from "normalize-wheel";
import { useFrame, useThree } from "@react-three/fiber";

const Scene = ({ scrollPosRef }) => {
  const mounted = useRefMounted();
  const imagesRef = useRef();
  const { viewport, invalidate } = useThree();
  const { width } = viewport;
  const imageOffsetLimit = getImageOffsetLimit(width);
  const scrollLimit = getDefaultScrollLimit(width);
  const numImages = IMAGES_ARR.length;
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

  const onWheelHandler = useCallback(
    (e) => {
      const { pixelX, pixelY } = normalizeWheel(e);
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
    [invalidate, scrollPosRef, width]
  );

  useEffect(() => {
    window.addEventListener("wheel", onWheelHandler);
    return () => {
      window.removeEventListener("wheel", onWheelHandler);
    };
  }, [onWheelHandler]);

  useFrame((_, delta) => {
    if (!mounted.current) return;
    updatePlanes(delta);
  });

  return (
    <group ref={imagesRef}>
      {IMAGES_ARR.map((url, index) => (
        <ImageBlock url={url} key={index} index={index} />
      ))}
    </group>
  );
};

export default Scene;
