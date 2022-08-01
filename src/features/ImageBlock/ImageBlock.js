import { useThree } from "@react-three/fiber";
import { getDefaultImageDimension } from "utils/utilFn";
import { useTexture } from "@react-three/drei";
import "./ImageShaderMaterial";
import { DEFAULT_IMAGE_SCALE, IMAGE_DIMENSION, IMAGES_ARR } from "utils/format";
const ImageBlock = ({ url, index, imagesRef }) => {
  const { viewport } = useThree();
  const [imgTexture] = useTexture([url]);
  const { width } = viewport;
  const {
    width: defaultWidth,
    height: defaultHeight,
    gap: defaultGap,
  } = getDefaultImageDimension(width);
  const numImages = IMAGES_ARR.length;
  const onClickHandler = () => {};
  return (
    <mesh
      position={[index * (defaultWidth + defaultGap), 0, 0]}
      scale={[defaultWidth, defaultHeight, 1]}
      onClick={onClickHandler}
    >
      <planeBufferGeometry args={[1, 1, 128, 128]} />
      <imageShaderMaterial
        tex={imgTexture}
        index={index}
        dimension={[
          (defaultHeight / defaultWidth) *
            (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
            (1 / DEFAULT_IMAGE_SCALE),
          1 / DEFAULT_IMAGE_SCALE,
        ]}
        offset={[
          ((0.5 -
            0.5 /
              ((defaultHeight / defaultWidth) *
                (IMAGE_DIMENSION.width / IMAGE_DIMENSION.height) *
                (1 / DEFAULT_IMAGE_SCALE))) *
            index) /
            (numImages - 1),
          0,
        ]}
      />
    </mesh>
  );
};
export default ImageBlock;

// 2200 1080

// (x - 0.5) / a + 0.5
// (x - 0.5) * (defaultWidth / defaultHeight) * (1080 / 2200)

// rectanble box, from (0,0) => (1,1)
// texture box is also (0, 0) => (1, 1), but we want to keep the ratio
// 点数为2200 * 1080， 我们暂时想展示所有的竖着的点，所以某一个点占了 1 / 1080个单位， 但是我们只想取前（2200 / 1800）横着的点。
// 所以我们有【2200 * （defaultWidth / defaultHeight, 1080]的点数

// so, we want to map (0,0) maps (0,0), (1, 1) => ((defaultWidth / defaultHeight) * () ,1)
//  y = （1080 / 2200）* 0.9 * x

// ---------(2200 / 1800, 0.9) k = 0.9 * （
// ---------
// ---------

// y = (2200 / 1800) * (defaultHeigth / defaultWidth) * (x - 0.5) + 0.5;
