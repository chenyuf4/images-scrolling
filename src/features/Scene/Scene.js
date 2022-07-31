import ImageBlock from "features/ImageBlock/ImageBlock";
import { IMAGES_ARR } from "utils/format";
import useRefMounted from "hooks/useRefMounted";
import { useRef, useCallback, useEffect } from "react";
import { getDefaultImageDimension, getDefaultScrollLimit } from "utils/utilFn";
import normalizeWheel from "normalize-wheel";
import { useThree } from "@react-three/fiber";
const Scene = ({ scrollPosRef }) => {
  const mounted = useRefMounted();
  const animationRef = useRef();
  const imagesRef = useRef();
  const { viewport } = useThree();
  const { width } = viewport;
  console.log("rendered");

  const updatePlanes = useCallback(() => {
    const { current, target } = scrollPosRef.current;
    let newCurrentPos = current + (target - current) * 0.03;
    if (Math.abs(newCurrentPos - target) <= 0.001) {
      newCurrentPos = target;
    }
    const { width: defaultWidth, gap: defaultGap } =
      getDefaultImageDimension(width);
    imagesRef.current.children.forEach((item, index) => {
      const defaultPosition = index * (defaultWidth + defaultGap);
      item.position.x = defaultPosition + newCurrentPos;
    });

    scrollPosRef.current.current = newCurrentPos;
    if (newCurrentPos !== target) {
      animationRef.current = window.requestAnimationFrame(updatePlanes);
    }
  }, [scrollPosRef, width]);

  const onWheelHandler = useCallback(
    (e) => {
      const { pixelX, pixelY } = normalizeWheel(e);
      const relativeSpeed = Math.min(
        Math.max(Math.abs(pixelX), Math.abs(pixelY)),
        100
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

      animationRef.current = window.requestAnimationFrame(updatePlanes);
    },
    [scrollPosRef, updatePlanes, width]
  );

  useEffect(() => {
    return () =>
      animationRef.current && window.cancelAnimationFrame(animationRef.current);
  }, []);

  useEffect(() => {
    window.addEventListener("wheel", onWheelHandler);
    return () => {
      window.removeEventListener("wheel", onWheelHandler);
    };
  }, [onWheelHandler]);

  return (
    <group ref={imagesRef}>
      {IMAGES_ARR.map((url, index) => (
        <ImageBlock url={url} key={index} index={index} />
      ))}
    </group>
  );
};

export default Scene;
