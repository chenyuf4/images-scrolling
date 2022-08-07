import { Image } from "@react-three/drei";

import { useThree } from "@react-three/fiber";
import { useCallback } from "react";
import {
  SMALL_IMAGES_PADDING,
  SMALL_IMAGE_WIDTH_RATIO,
  SMALL_IMAGE_WIDTH_HEIGHT_RATIO,
  SMALL_IMAGE_GAP_RATIO,
  SMALL_IMAGE_GAP,
} from "utils/format";

const MinimapImageBlock = ({ url, index }) => {
  const { viewport } = useThree();
  const { width, height } = viewport;
  const getSmallImageDimension = useCallback(() => {
    return {
      width: width * SMALL_IMAGE_WIDTH_RATIO,
      height:
        (width * SMALL_IMAGE_WIDTH_RATIO) / SMALL_IMAGE_WIDTH_HEIGHT_RATIO,
      gap: SMALL_IMAGE_GAP,
    };
  }, [width]);

  const {
    width: smallWidth,
    height: smallHeight,
    gap: smallGap,
  } = getSmallImageDimension();
  const defaultSmallPosX =
    width / 2 - 7.5 * (smallWidth + smallGap) - SMALL_IMAGES_PADDING;
  return (
    <Image
      url={url}
      scale={[smallWidth, smallHeight, 1]}
      position={[
        defaultSmallPosX + index * (smallWidth + smallGap),
        -height / 2 - smallHeight,
        0.001,
      ]}
    />
  );
};

export default MinimapImageBlock;
