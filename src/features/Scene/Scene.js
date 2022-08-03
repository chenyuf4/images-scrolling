import ImageBlock from "features/ImageBlock/ImageBlock";
import { IMAGES_ARR, DELAY_CONSTANT } from "utils/format";
import useRefMounted from "hooks/useRefMounted";
import { useRef, useCallback, useEffect } from "react";
import { getDefaultImageDimension, getDefaultScrollLimit } from "utils/utilFn";
import normalizeWheel from "normalize-wheel";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Expo, Circ } from "gsap";

const Scene = ({ scrollPosRef }) => {
  const mounted = useRefMounted();
  const imagesRef = useRef();
  const { viewport, invalidate } = useThree();
  const { width } = viewport;
  const numImages = IMAGES_ARR.length;

  const {
    width: defaultWidth,
    height: defaultHeight,
    gap: defaultGap
  } = getDefaultImageDimension(width);

  const imagesPosRef = useRef(
    Array.from({ length: numImages }).map((_, index) => ({
      currentX: index * (defaultWidth + defaultGap),
      targetX: index * (defaultWidth + defaultGap),
      currentY: 0,
      targetY: 0,
      currentZ: 0,
      targetZ: 0
    }))
  );

  const clickedImageRef = useRef(-1);
  const modeRef = useRef("list");
  const tlRef = useRef(
    gsap.timeline({
      onStart: () => invalidate(),
      onUpdateParams: () => invalidate(),
      onUpdate: () => invalidate()
    })
  );

  const updatePlanes = useCallback(
    (deltaTimeValue) => {
      imagesRef.current.children.forEach((item, index) => {
        const {
          currentX,
          targetX,
          currentY,
          targetY,
          currentZ,
          targetZ
        } = imagesPosRef.current[index];
        // updateX
        let newCurrentPosX =
          currentX + (targetX - currentX) * 7 * deltaTimeValue;
        if (Math.abs(newCurrentPosX - targetX) <= 0.001) {
          newCurrentPosX = targetX;
        }
        item.position.x = newCurrentPosX;

        // updateY
        let newCurrentPosY =
          currentY + (targetY - currentY) * 5 * deltaTimeValue;
        if (Math.abs(newCurrentPosY - targetY) <= 0.001) {
          newCurrentPosY = targetY;
        }
        item.position.y = newCurrentPosY;

        // updateZ
        // let newCurrentPosZ =
        //   currentZ + (targetZ - currentZ) * 5 * deltaTimeValue;
        // if (Math.abs(newCurrentPosZ - targetZ) <= 0.001) {
        //   newCurrentPosZ = targetZ;
        // }
        // item.position.z = newCurrentPosZ;

        imagesPosRef.current[index].currentX = newCurrentPosX;
        imagesPosRef.current[index].currentY = newCurrentPosY;
        // imagesPosRef.current[index].currentZ = newCurrentPosZ;
      });

      // scrollPosRef.current.current = newCurrentPos;
      if (
        imagesPosRef.current.some(
          (item) =>
            item.targetX !== item.currentX ||
            item.targetY !== item.currentY ||
            item.targetZ !== item.currentZ
        )
      ) {
        invalidate();
      }
    },
    [invalidate]
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

      if (modeRef.current === "detail") {
        tlRef.current.clear();
        modeRef.current = "list";
        const activeImage = clickedImageRef.current;
        // first image animate
        const mainImage = imagesRef.current.children[activeImage];
        tlRef.current
          .to(
            mainImage.scale,
            {
              x: defaultWidth,
              y: defaultHeight,
              ease: Circ.easeOut,
              duration: 0.6,
              onUpdate: function () {
                let j = 0;
                imagesRef.current.children.forEach((_, imgIndex) => {
                  if (imgIndex === activeImage) return;
                  tlRef.current
                    .set(
                      imagesPosRef.current[imgIndex],
                      {
                        targetX:
                          imagesPosRef.current[activeImage].targetX +
                          (imgIndex - activeImage) *
                            (defaultWidth + defaultGap),
                        targetY: 0,
                        delay: j * DELAY_CONSTANT
                      },
                      "start"
                    )
                    .set(imagesPosRef.current[imgIndex], {
                      targetZ: 0
                    });
                  j += 1;
                });
              }
            },
            "start"
          )
          .set(
            imagesPosRef.current[activeImage],
            {
              targetX: 0,
              targetY: 0
            },
            "start"
          );
        let i = 1;
        imagesRef.current.children.forEach((imgMesh, imgIndex) => {
          if (imgIndex === activeImage) return;
          tlRef.current.to(
            imgMesh.scale,
            {
              x: defaultWidth,
              y: defaultHeight,
              duration: 0.6,
              delay: i * DELAY_CONSTANT,
              ease: Circ.easeOut
            },
            "start"
          );
          i += 1;
        });
      }
      // update target position

      const scrollLimit = getDefaultScrollLimit(width);
      imagesPosRef.current.forEach((_, index) => {
        const rBoundary = index * (defaultWidth + defaultGap);
        const lBoundary = rBoundary - scrollLimit;
        let target =
          imagesPosRef.current[index].targetX +
          (direction === "L" ? -scrollSpeed : scrollSpeed);
        target = Math.max(lBoundary, Math.min(rBoundary, target));
        imagesPosRef.current[index].targetX = target;
      });
      invalidate();
    },
    [invalidate, width, defaultGap, defaultWidth, defaultHeight]
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
      imagesPosRef.current.every(
        (item) =>
          item.targetZ === item.currentZ &&
          item.targetY === item.currentY &&
          item.targetX === item.currentX
      )
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
            imagesPosRef={imagesPosRef}
            clickedImageRef={clickedImageRef}
            modeRef={modeRef}
            tlRef={tlRef}
          />
        ))}
      </group>
    </>
  );
};

export default Scene;
