import { Image } from "@react-three/drei";
import { getSmallImageDimension } from "utils/utilFn";
import { useThree } from "@react-three/fiber";
import { SMALL_IMAGES_PADDING } from "utils/format";

const MinimapImageBlock = ({ url, index }) => {
  const { viewport } = useThree();
  const { width, height } = viewport;

  const {
    width: smallWidth,
    height: smallHeight,
    gap: smallGap,
  } = getSmallImageDimension(width);

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
