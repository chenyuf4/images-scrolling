import ImageBlock from "features/ImageBlock/ImageBlock";
import {
  IMAGES_ARR,
  IMAGE_DIMENSION,
  DEFAULT_IMAGE_SCALE,
  SMALL_IMAGES_PADDING,
} from "utils/format";
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
import { useMediaQuery } from "react-responsive";
import MinimapImageBlock from "features/MinimapImageBlock/MinimapImageBlock";
import { Html } from "@react-three/drei";

const RECOVER_DELAY_CONSTANT = 0.055;
const Scene = ({ scrollPosRef, imgTitleRef }) => {
  const mounted = useRefMounted();
  const imagesRef = useRef();
  const { viewport } = useThree();
  const { width, height } = viewport;
  const imageOffsetLimit = getImageOffsetLimit(width);
  const scrollLimit = getDefaultScrollLimit(width);
  const numImages = IMAGES_ARR.length;
  const clickedImageRef = useRef(-1);
  const isBigScreen = useMediaQuery({ query: "(min-width: 1224px)" });
  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });
  const minimapImagesRef = useRef();
  const wireframeBoxRef = useRef();
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
  const wireframeRef = useRef();
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
    },
    [scrollPosRef, width, scrollLimit, imageOffsetLimit, numImages]
  );

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
      const delayValue =
        (activeImage === imgIndex ? 0 : delayIndex) * RECOVER_DELAY_CONSTANT;
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
            duration: imgIndex === activeImage ? 1.1 : 0.75,
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
      if (!isBigScreen || !isLandscape) return;
      const { pixelX, pixelY } = normalizeWheel(e);

      // clear all animations and make all images return to original positions
      if (modeRef.current.every((item) => item.value === "detail")) {
        const tl = tlRef.current;
        tl.clear();
        const activeImage = clickedImageRef.current;
        scrollPosRef.current.target =
          -activeImage * (defaultWidth + defaultGap);
        let delayIndex = 0;
        imagesRef.current.children.forEach((imgMesh, imgIndex) => {
          recoverImages(imgMesh, imgIndex, activeImage, delayIndex);
          if (imgIndex !== activeImage) delayIndex += 1;
        });
        // clear title
        tl.to(
          imgTitleRef.current,
          {
            transform: "translateY(-100%)",
            duration: 0.55,
            delay: 0.05,
            ease: Power4.easeOut,
          },
          "start"
        );

        // recover minimap image
        tl.to(
          minimapImagesRef.current.children[activeImage].position,
          {
            y: -height / 2 - smallHeight,
            duration: 0.9,
            ease: Power4.easeOut,
          },
          "start"
        ).to(
          wireframeBoxRef.current,
          {
            opacity: 0,
            duration: 0.3,
            ease: Power4.easeOut,
          },
          "start"
        );
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
    [
      defaultGap,
      defaultWidth,
      height,
      imgTitleRef,
      isBigScreen,
      isLandscape,
      recoverImages,
      scrollPosRef,
      smallHeight,
      width,
    ]
  );

  const resizeHandler = useCallback(() => {
    if (clickedImageRef.current >= 0) {
      scrollPosRef.current.target =
        -clickedImageRef.current * (defaultWidth + defaultGap);
      for (let i = 0; i < numImages; i++) {
        modeRef.current[i].value = "list";
      }
      clickedImageRef.current = -1;
    }
    imagesRef.current.children.forEach((imgMesh, imgIndex) => {
      const defaultPosX = imgIndex * (defaultWidth + defaultGap);
      imgMesh.position.x = defaultPosX - scrollPosRef.current.target;
      imgMesh.position.y = 0;
      imgMesh.position.z = 0;
      imgMesh.scale.x = defaultWidth;
      imgMesh.scale.y = defaultHeight;
      imgMesh.material.uniforms.dimension.value = [
        (defaultHeight / defaultWidth) *
          (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
          (1 / DEFAULT_IMAGE_SCALE),
        1 / DEFAULT_IMAGE_SCALE,
      ];
      const scrollPercentage =
        Math.abs(imgMesh.position.x - defaultPosX) / scrollLimit;
      const defaultImageOffset =
        (imageOffsetLimit * imgIndex) / (numImages - 1);
      imgMesh.material.uniforms.offset.value = [
        defaultImageOffset - scrollPercentage * imageOffsetLimit,
        0,
      ];
    });

    // hide all minimap images
    const defaultSmallPosX =
      width / 2 - 7.5 * (smallWidth + smallGap) - SMALL_IMAGES_PADDING;
    minimapImagesRef.current.children.forEach((imgMesh, imgIndex) => {
      imgMesh.position.x =
        defaultSmallPosX + imgIndex * (smallWidth + smallGap);
      imgMesh.position.y = -height / 2 - smallHeight;
    });

    wireframeBoxRef.current.style.opacity = 0;
    imgTitleRef.current.style.transform = "translateY(100%)";
  }, [
    defaultGap,
    defaultHeight,
    defaultWidth,
    height,
    imageOffsetLimit,
    imgTitleRef,
    numImages,
    scrollLimit,
    scrollPosRef,
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
            clickedImageRef={clickedImageRef}
            minimapImagesRef={minimapImagesRef}
            wireframeRef={wireframeRef}
            imgTitleRef={imgTitleRef}
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
      <group
        ref={wireframeRef}
        position={[
          width / 2 - 7.5 * (smallWidth + smallGap) - SMALL_IMAGES_PADDING,
          -height / 2 + smallHeight / 2 + SMALL_IMAGES_PADDING,
          0.002,
        ]}
      >
        <Html transform occlude>
          <div
            ref={wireframeBoxRef}
            className="wireframe-container"
            style={{
              width: `${smallWidth * 42}px`,
              height: `${smallHeight * 42}px`,
            }}
          ></div>
        </Html>
      </group>
    </>
  );
};

export default Scene;
