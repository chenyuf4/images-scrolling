import {
  DEFAULT_IMAGE_GAP_RATIO,
  DEFAULT_IMAGE_WIDTH_HEIGHT_RATIO,
  DEFAULT_IMAGE_WIDTH_RATIO,
} from "./format";
import { IMAGES_ARR } from "./format";

const numImages = IMAGES_ARR.length;
export const getDefaultImageDimension = (canvasWidth) => {
  return {
    width: canvasWidth * DEFAULT_IMAGE_WIDTH_RATIO,
    height:
      (canvasWidth * DEFAULT_IMAGE_WIDTH_RATIO) /
      DEFAULT_IMAGE_WIDTH_HEIGHT_RATIO,
    gap: canvasWidth * DEFAULT_IMAGE_GAP_RATIO,
  };
};

export const getDefaultScrollLimit = (canvasWidth) => {
  const { width, gap } = getDefaultImageDimension(canvasWidth);
  return (numImages - 1) * (width + gap);
};
