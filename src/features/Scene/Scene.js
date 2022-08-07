import ImageBlock from "features/ImageBlock/ImageBlock";
import MinimapImageBlock from "features/MinimapImageBlock/MinimapImageBlock";
import {
  IMAGES_ARR,
  DELAY_CONSTANT,
  DEFAULT_IMAGE_SCALE,
  IMAGE_DIMENSION,
  SMALL_IMAGES_PADDING,
  SMALL_IMAGE_WIDTH_RATIO,
  SMALL_IMAGE_WIDTH_HEIGHT_RATIO,
  SMALL_IMAGE_GAP_RATIO,
  DEFAULT_IMAGE_WIDTH_RATIO,
  DEFAULT_IMAGE_GAP_RATIO,
  DEFAULT_IMAGE_WIDTH_HEIGHT_RATIO,
  DEFAULT_IMAGE_GAP,
  SMALL_IMAGE_GAP,
} from "utils/format";
import useRefMounted from "hooks/useRefMounted";
import { useRef, useCallback, useEffect } from "react";

import normalizeWheel from "normalize-wheel";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useMediaQuery } from "react-responsive";
import { Power4 } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const Scene = () => {
  const mounted = useRefMounted();
  const imagesRef = useRef();
  const { viewport } = useThree();
  const { width, height } = viewport;
  const numImages = IMAGES_ARR.length;
  const isBigScreen = useMediaQuery({ query: "(min-width: 1224px)" });
  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });

  const getSmallImageDimension = useCallback(() => {
    return {
      width: width * SMALL_IMAGE_WIDTH_RATIO,
      height:
        (width * SMALL_IMAGE_WIDTH_RATIO) / SMALL_IMAGE_WIDTH_HEIGHT_RATIO,
      gap: SMALL_IMAGE_GAP,
    };
  }, [width]);

  const getDefaultImageDimension = useCallback(() => {
    return {
      width: width * DEFAULT_IMAGE_WIDTH_RATIO,
      height:
        (width * DEFAULT_IMAGE_WIDTH_RATIO) / DEFAULT_IMAGE_WIDTH_HEIGHT_RATIO,
      gap: DEFAULT_IMAGE_GAP,
    };
  }, [width]);

  const getDefaultScrollLimit = useCallback(() => {
    const { width, gap } = getDefaultImageDimension();
    return (numImages - 1) * (width + gap);
  }, [getDefaultImageDimension, numImages]);

  const getImageOffsetLimit = useCallback(() => {
    const { width: defaultWidth, height: defaultHeight } =
      getDefaultImageDimension();

    return (
      0.5 -
      0.5 /
        ((defaultHeight / defaultWidth) *
          (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
          (1 / DEFAULT_IMAGE_SCALE))
    );
  }, [getDefaultImageDimension]);

  const {
    width: defaultWidth,
    height: defaultHeight,
    gap: defaultGap,
  } = getDefaultImageDimension();

  const {
    width: smallWidth,
    height: smallHeight,
    gap: smallGap,
  } = getSmallImageDimension();

  const imageOffsetLimit = getImageOffsetLimit(width);
  const scrollLimit = getDefaultScrollLimit(width);

  const imagesPosRef = useRef(
    Array.from({ length: numImages }).map((_, index) => ({
      currentX: index * (defaultWidth + defaultGap),
      targetX: index * (defaultWidth + defaultGap),
      currentY: 0,
      targetY: 0,
    }))
  );

  const clickedImageRef = useRef(-1);
  const modeRef = useRef("list");
  const minimapImagesRef = useRef();
  const tlRef = useRef(gsap.timeline());

  const updatePlanes = useCallback(
    (deltaTimeValue) => {
      imagesRef.current.children.forEach((item, index) => {
        const { currentX, targetX, currentY, targetY } =
          imagesPosRef.current[index];
        // updateX
        let newCurrentPosX =
          currentX + (targetX - currentX) * 5.5 * deltaTimeValue;
        if (Math.abs(newCurrentPosX - targetX) <= 0.001) {
          newCurrentPosX = targetX;
        }
        item.position.x = newCurrentPosX;

        // updateY
        let newCurrentPosY =
          currentY + (targetY - currentY) * 5.5 * deltaTimeValue;
        if (Math.abs(newCurrentPosY - targetY) <= 0.001) {
          newCurrentPosY = targetY;
        }
        item.position.y = newCurrentPosY;

        imagesPosRef.current[index].currentX = newCurrentPosX;
        imagesPosRef.current[index].currentY = newCurrentPosY;

        // update image scroll offset
        if (modeRef.current === "list") {
          const scrollPercentage =
            Math.abs(newCurrentPosX - index * (defaultGap + defaultWidth)) /
            scrollLimit;
          const defaultImageOffset =
            (imageOffsetLimit * index) / (numImages - 1);
          item.material.uniforms.offset.value = [
            defaultImageOffset - scrollPercentage * imageOffsetLimit,
            0,
          ];
        }
      });
    },
    [defaultWidth, defaultGap, imageOffsetLimit, numImages, scrollLimit]
  );

  const correctShaderDimensionFn = useCallback(
    (h, targetHeight) => {
      const a = (1 - 1 / DEFAULT_IMAGE_SCALE) / (targetHeight - defaultHeight);
      const b = 1 - a * targetHeight;
      return a * h + b;
    },
    [defaultHeight]
  );

  const onWheelHandler = useCallback(
    (e) => {
      if (!isBigScreen || !isLandscape) return;
      const { pixelX, pixelY } = normalizeWheel(e);

      const relativeSpeed = Math.min(
        100,
        Math.max(Math.abs(pixelX), Math.abs(pixelY))
      );

      const scrollSpeed = relativeSpeed * 0.01;
      const scrollLimit = getDefaultScrollLimit(width);
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
        const rMainImageBoundary = activeImage * (defaultWidth + defaultGap);
        const lMainImageBoundary = rMainImageBoundary - scrollLimit;
        tlRef.current
          .set(
            imagesPosRef.current[activeImage],
            {
              targetX: Math.max(
                lMainImageBoundary,
                Math.min(
                  rMainImageBoundary,
                  direction === "L" ? -scrollSpeed : scrollSpeed
                )
              ),
              targetY: 0,
            },
            "start"
          )
          .to(mainImage.scale, {
            x: defaultWidth,
            y: defaultHeight,
            ease: CustomEase.create(
              "custom",
              "M0,0 C0.038,0.5 0.05,0.562 0.196,0.756 0.344,0.953 0.504,1 1,1 "
            ),
            duration: 1,
            onUpdate: function () {
              let j = 0;
              imagesRef.current.children.forEach((_, imgIndex) => {
                if (imgIndex === activeImage) return;
                tlRef.current.set(
                  imagesPosRef.current[imgIndex],
                  {
                    targetX:
                      imagesPosRef.current[activeImage].targetX +
                      (imgIndex - activeImage) * (defaultWidth + defaultGap),
                    targetY: 0,
                    delay: j * DELAY_CONSTANT,
                  },
                  "start"
                );
                j += 1;
              });

              const { x, y } = this.targets()[0];
              const correctScaleRatio = correctShaderDimensionFn(y, height);
              mainImage.material.uniforms.dimension.value = [
                (y / x) *
                  (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
                  correctScaleRatio,
                correctScaleRatio,
              ];
            },
          })
          .to(
            minimapImagesRef.current.children[activeImage].position,
            {
              y: -height / 2 - smallHeight,
              duration: 1.1,
              ease: Power4.easeOut,
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
              ease: Power4.easeOut,
              onUpdate: function () {
                const { x, y } = this.targets()[0];
                const correctScaleRatio = correctShaderDimensionFn(
                  y,
                  smallHeight
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
          );
          i += 1;
        });
        return;
      }
      // update target position
      imagesPosRef.current.forEach((_, index) => {
        const rBoundary = index * (defaultWidth + defaultGap);
        const lBoundary = rBoundary - scrollLimit;
        let target =
          imagesPosRef.current[index].targetX +
          (direction === "L" ? -scrollSpeed : scrollSpeed);
        target = Math.max(lBoundary, Math.min(rBoundary, target));
        imagesPosRef.current[index].targetX = target;
      });
    },
    [
      isBigScreen,
      isLandscape,
      getDefaultScrollLimit,
      width,
      defaultWidth,
      defaultGap,
      defaultHeight,
      height,
      smallHeight,
      correctShaderDimensionFn,
    ]
  );

  const resizeHandler = useCallback(() => {
    imagesPosRef.current.forEach((item, index) => {
      item.targetX = index * (defaultWidth + defaultGap);
      item.targetY = 0;
    });
    imagesRef.current.children.forEach((imgMesh, imgIndex) => {
      imgMesh.scale.x = defaultWidth;
      imgMesh.scale.y = defaultHeight;
      imgMesh.material.uniforms.dimension.value = [
        (defaultHeight / defaultWidth) *
          (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
          (1 / DEFAULT_IMAGE_SCALE),
        1 / DEFAULT_IMAGE_SCALE,
      ];

      imgMesh.material.uniforms.offset.value = [
        ((0.5 -
          0.5 /
            ((defaultHeight / defaultWidth) *
              (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
              (1 / DEFAULT_IMAGE_SCALE))) *
          imgIndex) /
          (numImages - 1),
        0,
      ];
    });

    const defaultSmallPosX =
      width / 2 - 7.5 * (smallWidth + smallGap) - SMALL_IMAGES_PADDING;
    minimapImagesRef.current.children.forEach((imgMesh, imgIndex) => {
      imgMesh.position.x =
        defaultSmallPosX + imgIndex * (smallWidth + smallGap);
      imgMesh.position.y = -height / 2 - smallHeight;
    });
  }, [
    defaultGap,
    defaultHeight,
    defaultWidth,
    height,
    numImages,
    smallGap,
    smallHeight,
    smallWidth,
    width,
  ]);

  useEffect(() => {
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [resizeHandler]);

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
          item.targetY === item.currentY && item.targetX === item.currentX
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
            minimapImagesRef={minimapImagesRef}
            clickedImageRef={clickedImageRef}
            modeRef={modeRef}
            tlRef={tlRef}
          />
        ))}
      </group>
      <group ref={minimapImagesRef}>
        {IMAGES_ARR.map((url, index) => (
          <MinimapImageBlock
            url={url}
            key={index}
            index={index}
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
